from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user, require_roles
from app.models import User, UserRole, RevenueRecord, AgencyClient
from app.schemas import RevenueRecordCreate, RevenueRecordResponse, AgencyClientResponse, AgencyClientCreate

router = APIRouter(prefix="/api/v1/revenue", tags=["Revenue"])

@router.get("/records", response_model=List[RevenueRecordResponse])
def get_revenue_records(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(RevenueRecord)
    if current_user.role == UserRole.CREATOR:
        query = query.filter(RevenueRecord.user_id == current_user.id)
    records = query.order_by(RevenueRecord.deal_date.desc()).all()
    return records

@router.post("/records", response_model=RevenueRecordResponse)
def add_revenue_record(
    payload: RevenueRecordCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record = RevenueRecord(
        user_id=current_user.id,
        title=payload.title,
        source_type=payload.source_type,
        amount=payload.amount,
        brand_name=payload.brand_name,
        status=payload.status or "Completed"
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

@router.delete("/records/{record_id}")
def delete_revenue_record(
    record_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(RevenueRecord).filter(RevenueRecord.id == record_id)
    if current_user.role == UserRole.CREATOR:
        query = query.filter(RevenueRecord.user_id == current_user.id)
    record = query.first()
    if not record:
        raise HTTPException(status_code=404, detail="Revenue deal not found")
    db.delete(record)
    db.commit()
    return {"status": "success", "message": "Deal removed"}

@router.get("/summary")
def get_revenue_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    records_query = db.query(RevenueRecord)
    if current_user.role == UserRole.CREATOR:
        records_query = records_query.filter(RevenueRecord.user_id == current_user.id)
    all_records = records_query.all()

    total_revenue = sum(r.amount for r in all_records)
    pending_revenue = sum(r.amount for r in all_records if (r.status or "").lower() in ["pending", "processing"])

    # Aggregate dynamically by source_type from actual DB records
    source_sums = {}
    for r in all_records:
        stype = r.source_type or "Other"
        source_sums[stype] = source_sums.get(stype, 0.0) + r.amount

    total_calc = total_revenue if total_revenue > 0 else 1.0
    by_source = [
        {
            "source": k,
            "amount": round(v, 2),
            "percentage": round((v / total_calc) * 100, 1)
        }
        for k, v in source_sums.items()
    ]

    return {
        "total_revenue": total_revenue,
        "pending_revenue": pending_revenue,
        "completed_deals_count": len(all_records),
        "by_source": by_source,
        "role": current_user.role
    }

@router.get("/agency/roster", response_model=List[AgencyClientResponse])
def get_agency_roster(
    current_user: User = Depends(require_roles([UserRole.AGENCY, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    roster = db.query(AgencyClient).all()
    return roster

@router.post("/agency/roster", response_model=AgencyClientResponse)
def add_agency_client(
    payload: AgencyClientCreate,
    current_user: User = Depends(require_roles([UserRole.AGENCY, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    client = AgencyClient(
        agency_id=current_user.id,
        creator_id=current_user.id,
        client_name=payload.client_name,
        channel_handle=payload.channel_handle,
        tier=payload.tier or "Tier 1 - VIP",
        monthly_views=payload.monthly_views or 1000000,
        commission_pct=payload.commission_pct or 15.0,
        monthly_revenue=payload.monthly_revenue or 15000.0,
        status=payload.status or "Active"
    )
    db.add(client)
    db.commit()
    db.refresh(client)
    return client

@router.delete("/agency/roster/{client_id}")
def delete_agency_client(
    client_id: str,
    current_user: User = Depends(require_roles([UserRole.AGENCY, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    client = db.query(AgencyClient).filter(AgencyClient.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    db.delete(client)
    db.commit()
    return {"status": "success", "message": "Client removed from roster"}
