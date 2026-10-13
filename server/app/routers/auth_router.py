from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db, log_audit_event
from app.models import User, UserRole, SocialAccount, ContentPost, RevenueRecord, AgencyClient
from app.auth import hash_password, verify_password, create_access_token, get_current_user
from app.schemas import RegisterSchema, LoginSchema, TokenResponse, UserResponse

class SwitchRoleSchema(BaseModel):
    role: UserRole

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])

# Seed demo users on startup if they don't exist
def ensure_seed_data(db: Session):
    demo_creators = [
        {"email": "creator@creatoriq.com", "role": UserRole.CREATOR, "name": "Alex Rivera (Creator)"},
        {"email": "agency@creatoriq.com", "role": UserRole.AGENCY, "name": "Nexus Talent Agency"},
        {"email": "marketing@creatoriq.com", "role": UserRole.MARKETING_TEAM, "name": "Apex Marketing Global"},
        {"email": "admin@creatoriq.com", "role": UserRole.ADMIN, "name": "System Administrator"}
    ]

    for u in demo_creators:
        existing = db.query(User).filter(User.email == u["email"]).first()
        if not existing:
            user = User(
                email=u["email"],
                full_name=u["name"],
                hashed_password=hash_password("password123"),
                role=u["role"],
                avatar_url=f"https://api.dicebear.com/7.x/avataaars/svg?seed={u['email']}"
            )
            db.add(user)
            db.commit()
            db.refresh(user)

            # Seed default social accounts for creator
            if u["role"] == UserRole.CREATOR:
                accounts = [
                    SocialAccount(user_id=user.id, platform="youtube", account_handle="@alexrivera_tech", display_name="Alex Rivera Tech", follower_count=145000),
                    SocialAccount(user_id=user.id, platform="instagram", account_handle="@alexrivera.creates", display_name="Alex Rivera", follower_count=89400),
                    SocialAccount(user_id=user.id, platform="linkedin", account_handle="@alexriverapro", display_name="Alex Rivera | Creator & Dev", follower_count=34000)
                ]
                db.add_all(accounts)

                # Seed sample posts
                posts = [
                    ContentPost(user_id=user.id, platform="youtube", title="Building Autonomous AI Systems in 2026", views=182000, likes=14200, comments=1340, shares=890, engagement_rate=8.5),
                    ContentPost(user_id=user.id, platform="instagram", title="Day in the Life: Fullstack Creator Studio", views=94000, likes=8900, comments=420, shares=1250, engagement_rate=9.9),
                    ContentPost(user_id=user.id, platform="youtube", title="React 19 vs Next.js: The Honest Deep Dive", views=145000, likes=9800, comments=820, shares=540, engagement_rate=7.3),
                    ContentPost(user_id=user.id, platform="linkedin", title="How We Scaled Creator Revenue 3x with Smart Data", views=42000, likes=3100, comments=380, shares=490, engagement_rate=8.3)
                ]
                db.add_all(posts)

                # Seed sample revenues
                revenues = [
                    RevenueRecord(user_id=user.id, title="Q1 Cloud Sponsor Dedicated Video", source_type="Sponsorship", amount=15000.0, brand_name="DigitalOcean", status="Completed"),
                    RevenueRecord(user_id=user.id, title="YouTube AdSense - March", source_type="AdSense", amount=8450.0, brand_name="Google", status="Completed"),
                    RevenueRecord(user_id=user.id, title="Developer Tools Affiliate Sales", source_type="Affiliate", amount=4500.0, brand_name="Cursor & Raycast", status="Completed"),
                    RevenueRecord(user_id=user.id, title="Keynote Speaking & Brand Deal", source_type="Sponsorship", amount=10500.0, brand_name="Supabase", status="Processing")
                ]
                db.add_all(revenues)
                db.commit()

            # Seed agency roster if agency
            if u["role"] == UserRole.AGENCY:
                agency_roster = [
                    AgencyClient(agency_id=user.id, creator_id=user.id, client_name="Alex Rivera", channel_handle="@alexrivera_tech", tier="Tier 1 - VIP", monthly_views=1480000, commission_pct=15.0, monthly_revenue=38450.0, status="Active"),
                    AgencyClient(agency_id=user.id, creator_id=user.id, client_name="Sarah Chen AI", channel_handle="@sarahchen_data", tier="Tier 1 - VIP", monthly_views=2100000, commission_pct=18.0, monthly_revenue=46200.0, status="Active"),
                    AgencyClient(agency_id=user.id, creator_id=user.id, client_name="Marcus Vance Design", channel_handle="@marcusvance", tier="Tier 2 - Growth", monthly_views=820000, commission_pct=15.0, monthly_revenue=18500.0, status="Active"),
                    AgencyClient(agency_id=user.id, creator_id=user.id, client_name="Elena Rostova Gaming", channel_handle="@elena_gg", tier="Tier 1 - VIP", monthly_views=3400000, commission_pct=20.0, monthly_revenue=62000.0, status="Active")
                ]
                db.add_all(agency_roster)
                db.commit()

@router.post("/register", response_model=TokenResponse)
def register(user_in: RegisterSchema, db: Session = Depends(get_db)):
    ensure_seed_data(db)
    if db.query(User).filter(User.email == user_in.email).first():
        raise HTTPException(status_code=400, detail="Email is already registered")
    
    clean_handle = user_in.email.split("@")[0].lower()
    display_name = user_in.full_name or clean_handle.capitalize()
    
    user = User(
        email=user_in.email,
        full_name=display_name,
        hashed_password=hash_password(user_in.password),
        role=user_in.role,
        avatar_url=f"https://api.dicebear.com/7.x/avataaars/svg?seed={user_in.email}"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Seed starter sample data based on selected role
    if user.role == UserRole.CREATOR:
        accounts = [
            SocialAccount(user_id=user.id, platform="youtube", account_handle=f"@{clean_handle}_yt", display_name=f"{display_name} Channel", follower_count=125000),
            SocialAccount(user_id=user.id, platform="instagram", account_handle=f"@{clean_handle}", display_name=display_name, follower_count=78000),
            SocialAccount(user_id=user.id, platform="linkedin", account_handle=f"@{clean_handle}_pro", display_name=f"{display_name} | Creator", follower_count=29000)
        ]
        db.add_all(accounts)

        posts = [
            ContentPost(user_id=user.id, platform="youtube", title=f"My Journey as a Digital Creator in 2026", views=145000, likes=12100, comments=980, shares=720, engagement_rate=8.9),
            ContentPost(user_id=user.id, platform="instagram", title=f"Behind the scenes creating content today", views=82000, likes=7400, comments=390, shares=890, engagement_rate=9.5),
            ContentPost(user_id=user.id, platform="youtube", title=f"Top 5 Tools Every Creator Needs to Scale Fast", views=112000, likes=8600, comments=670, shares=480, engagement_rate=8.2),
            ContentPost(user_id=user.id, platform="linkedin", title=f"Why Authenticity and Analytics Beat Hype in 2026", views=38000, likes=2800, comments=310, shares=410, engagement_rate=8.1)
        ]
        db.add_all(posts)

        revenues = [
            RevenueRecord(user_id=user.id, title="Brand Partnership - Creator Launch", source_type="Sponsorship", amount=12000.0, brand_name="Notion & Loom", status="Completed"),
            RevenueRecord(user_id=user.id, title="AdSense Revenue - Current Month", source_type="AdSense", amount=6800.0, brand_name="Google", status="Completed"),
            RevenueRecord(user_id=user.id, title="Affiliate Commission - Creator Stack", source_type="Affiliate", amount=3200.0, brand_name="AudioJungle & Envato", status="Completed")
        ]
        db.add_all(revenues)
        db.commit()

    elif user.role == UserRole.AGENCY:
        agency_roster = [
            AgencyClient(agency_id=user.id, creator_id=user.id, client_name="Alex Rivera", channel_handle="@alexrivera_tech", tier="Tier 1 - VIP", monthly_views=1480000, commission_pct=15.0, monthly_revenue=38450.0, status="Active"),
            AgencyClient(agency_id=user.id, creator_id=user.id, client_name="Sarah Chen AI", channel_handle="@sarahchen_data", tier="Tier 1 - VIP", monthly_views=2100000, commission_pct=18.0, monthly_revenue=46200.0, status="Active")
        ]
        db.add_all(agency_roster)
        db.commit()

    token = create_access_token({"sub": user.id, "role": user.role.value, "email": user.email})
    log_audit_event(
        action="USER_REGISTER",
        user_id=user.id,
        user_email=user.email,
        details={"role": user.role.value if hasattr(user.role, "value") else str(user.role)}
    )
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/login", response_model=TokenResponse)
def login(payload: LoginSchema, db: Session = Depends(get_db)):
    ensure_seed_data(db)
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        log_audit_event(
            action="LOGIN_FAILED",
            user_email=payload.email,
            status="FAILED",
            details={"reason": "Invalid credentials"}
        )
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_access_token({"sub": user.id, "role": user.role.value, "email": user.email})
    log_audit_event(
        action="USER_LOGIN",
        user_id=user.id,
        user_email=user.email,
        details={"role": user.role.value if hasattr(user.role, "value") else str(user.role)}
    )
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/switch-role", response_model=TokenResponse)
def switch_active_role(
    payload: SwitchRoleSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Switches the active RBAC operational profile for the authenticated user,
    maintaining user identity and recording the transition in the SQLite audit log.
    """
    old_role = current_user.role
    current_user.role = payload.role
    db.commit()
    db.refresh(current_user)

    log_audit_event(
        action="ROLE_SWITCH",
        user_id=current_user.id,
        user_email=current_user.email,
        details={
            "from_role": old_role.value if hasattr(old_role, "value") else str(old_role),
            "to_role": payload.role.value
        }
    )

    token = create_access_token({"sub": current_user.id, "role": current_user.role.value, "email": current_user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": current_user
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/demo-accounts")
def get_demo_accounts(db: Session = Depends(get_db)):
    ensure_seed_data(db)
    return [
        {"email": "creator@creatoriq.com", "role": "Creator", "password": "password123", "label": "Content Creator (Alex Rivera)"},
        {"email": "agency@creatoriq.com", "role": "Agency", "password": "password123", "label": "Influencer Agency (Nexus Talent)"},
        {"email": "marketing@creatoriq.com", "role": "Marketing Team", "password": "password123", "label": "Marketing Team (Apex Brand Ops)"},
        {"email": "admin@creatoriq.com", "role": "Administrator", "password": "password123", "label": "Administrator (Full System Control)"}
    ]
