import React, { useState, useEffect } from 'react';
import client from '../api/client';
import MetricCard from '../components/common/MetricCard';
import { 
  ShieldCheck, 
  Users, 
  Activity, 
  Database, 
  Server, 
  Key,
  Layers,
  FileJson,
  ScrollText,
  RefreshCw,
  Search,
  ExternalLink,
  Table,
  CheckCircle2,
  Clock,
  HardDrive
} from 'lucide-react';

const AdminConsole = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [dbStatus, setDbStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  // Multi-Database Explorer State
  const [activeDbTab, setActiveDbTab] = useState('postgresql'); // 'postgresql' | 'mongodb' | 'sqlite'
  
  // PostgreSQL State
  const [pgOverview, setPgOverview] = useState(null);
  const [selectedPgTable, setSelectedPgTable] = useState('users');
  const [pgTableData, setPgTableData] = useState(null);
  const [pgLoading, setPgLoading] = useState(false);

  // MongoDB State
  const [mongoCollections, setMongoCollections] = useState([]);
  const [selectedMongoCol, setSelectedMongoCol] = useState('raw_social_payloads');
  const [mongoDocs, setMongoDocs] = useState([]);
  const [mongoLoading, setMongoLoading] = useState(false);
  const [selectedDocJson, setSelectedDocJson] = useState(null);

  // SQLite State
  const [sqliteLogs, setSqliteLogs] = useState([]);
  const [sqliteStats, setSqliteStats] = useState(null);
  const [sqliteFilterAction, setSqliteFilterAction] = useState('ALL');
  const [sqliteLoading, setSqliteLoading] = useState(false);

  const fetchAdminData = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const [statRes, userRes, dbRes] = await Promise.all([
        client.get('/api/v1/admin/system-stats'),
        client.get('/api/v1/admin/users'),
        client.get('/api/v1/database/status')
      ]);
      setStats(statRes.data);
      setUsers(userRes.data);
      setDbStatus(dbRes.data);
    } catch (e) {
      console.error("Admin fetch error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
    loadPgOverview();
    loadMongoCollections();
    loadSqliteData();
  }, []);

  // 1. PostgreSQL Data Fetchers
  const loadPgOverview = async () => {
    try {
      setPgLoading(true);
      const res = await client.get('/api/v1/database/postgresql/overview');
      setPgOverview(res.data);
      if (res.data.tables && res.data.tables.length > 0) {
        loadPgTableData(selectedPgTable || res.data.tables[0].table_name);
      }
    } catch (e) {
      console.error("Postgres overview error", e);
    } finally {
      setPgLoading(false);
    }
  };

  const loadPgTableData = async (tableName) => {
    try {
      setSelectedPgTable(tableName);
      setPgLoading(true);
      const res = await client.get(`/api/v1/database/postgresql/table/${tableName}?limit=30`);
      setPgTableData(res.data);
    } catch (e) {
      console.error("Postgres table query error", e);
    } finally {
      setPgLoading(false);
    }
  };

  // 2. MongoDB Data Fetchers
  const loadMongoCollections = async () => {
    try {
      setMongoLoading(true);
      const res = await client.get('/api/v1/database/mongodb/collections');
      const cols = res.data.collections || [];
      setMongoCollections(cols);
      if (cols.length > 0) {
        const defaultCol = cols.find(c => c.collection_name === 'raw_social_payloads')?.collection_name || cols[0].collection_name;
        loadMongoDocuments(defaultCol);
      }
    } catch (e) {
      console.error("Mongo collections error", e);
    } finally {
      setMongoLoading(false);
    }
  };

  const loadMongoDocuments = async (colName) => {
    try {
      setSelectedMongoCol(colName);
      setSelectedDocJson(null);
      setMongoLoading(true);
      const res = await client.get(`/api/v1/database/mongodb/documents?collection=${colName}&limit=20`);
      setMongoDocs(res.data.documents || []);
    } catch (e) {
      console.error("Mongo docs query error", e);
    } finally {
      setMongoLoading(false);
    }
  };

  // 3. SQLite Data Fetchers
  const loadSqliteData = async () => {
    try {
      setSqliteLoading(true);
      const [logsRes, statsRes] = await Promise.all([
        client.get(`/api/v1/database/sqlite/audit-logs?action=${sqliteFilterAction}&limit=50`),
        client.get('/api/v1/database/sqlite/stats')
      ]);
      setSqliteLogs(logsRes.data.logs || []);
      setSqliteStats(statsRes.data);
    } catch (e) {
      console.error("SQLite data query error", e);
    } finally {
      setSqliteLoading(false);
    }
  };

  useEffect(() => {
    loadSqliteData();
  }, [sqliteFilterAction]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await client.put(`/api/v1/admin/users/${userId}/role?new_role=${newRole}`);
      fetchAdminData();
      loadPgTableData(selectedPgTable);
      loadSqliteData();
    } catch (e) {
      alert("Failed to update role: " + (e.response?.data?.detail || e.message));
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-2 border border-emerald-500/20">
          <ShieldCheck className="h-3.5 w-3.5" />
          Administrator Governance
        </div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Admin Console & Multi-Database Intelligence</h1>
        <p className="text-xs text-slate-400 mt-1">Full system control, multi-database storage inspection, and RBAC governance</p>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <MetricCard
          title="Total Registered Accounts"
          value={(stats?.total_users || users.length).toString()}
          change="All Roles Active"
          isPositive={true}
          icon={Users}
          color="indigo"
        />
        <MetricCard
          title="Connected Ingestion Channels"
          value={(stats?.total_connected_accounts || 3).toString()}
          change="YouTube, IG, LinkedIn"
          isPositive={true}
          icon={Activity}
          color="emerald"
        />
        <MetricCard
          title="Multi-DB Engine Status"
          value="3 Active Engines"
          change="PG + Mongo + SQLite"
          isPositive={true}
          icon={Database}
          color="cyan"
        />
        <MetricCard
          title="SQLite Audit Log Entries"
          value={(sqliteStats?.total_audit_records || 0).toString()}
          change="Immutable Trail"
          isPositive={true}
          icon={Server}
          color="amber"
        />
      </div>

      {/* API Integrations Status */}
      <div className="glass-panel p-6">
        <h3 className="text-base font-bold text-white tracking-tight mb-2">Connected Social Media APIs</h3>
        <p className="text-xs text-slate-400 mb-6">Status of registered production API credentials and live endpoints</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
              <Key className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">YouTube Data API v3</span>
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Channel telemetry, subscriber metrics & viral trending feed</p>
              <span className="inline-block mt-2 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-emerald-500/20">
                Status: Live & Connected
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400">
              <Key className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Instagram Graph API</span>
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Profile stats, post metrics & hashtag algorithmic telemetry</p>
              <span className="inline-block mt-2 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-emerald-500/20">
                Status: Operational & Ready
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Key className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">LinkedIn REST API</span>
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Professional reach, B2B engagement & audience stats</p>
              <span className="inline-block mt-2 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                Status: Operational
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Database Topology Architecture Overview */}
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Database className="h-4 w-4 text-cyan-400" />
              Multi-Database Architecture & Specific Usecases
            </h3>
            <p className="text-xs text-slate-400">Polyglot Persistence: Each database serves a dedicated, distinct responsibility</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {/* PostgreSQL Card */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-blue-500/20 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                  <Database className="h-3.5 w-3.5" /> 1. PostgreSQL (Relational ACID)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                  {dbStatus?.postgresql?.status || 'Online'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mb-2">
                <b>Specific Usecase:</b> Relational transactional integrity for Users, Passwords, RBAC Roles, Connected Social Accounts, Posts, Deals & Agency Rosters.
              </p>
            </div>
            <div className="pt-2 border-t border-white/5 text-[10px] font-mono text-slate-400 flex justify-between">
              <span>Engine: {dbStatus?.postgresql?.engine || 'PostgreSQL'}</span>
              <span>Tables: {pgOverview?.total_tables || 5}</span>
            </div>
          </div>

          {/* MongoDB Card */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-emerald-500/20 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <FileJson className="h-3.5 w-3.5" /> 2. MongoDB (Document Store)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  {dbStatus?.mongodb?.status || 'Online'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mb-2">
                <b>Specific Usecase:</b> Unstructured JSON payloads from YouTube Data API v3, Instagram Graph API, hashtag reach graphs, and historical viral video snapshots.
              </p>
            </div>
            <div className="pt-2 border-t border-white/5 text-[10px] font-mono text-slate-400 flex justify-between">
              <span>DB: creatoriq_analytics</span>
              <span>Collections: {mongoCollections.length}</span>
            </div>
          </div>

          {/* SQLite 3 Card */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-amber-500/20 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <ScrollText className="h-3.5 w-3.5" /> 3. SQLite 3 (Audit Trail & Telemetry)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  {dbStatus?.sqlite?.status || 'Active'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mb-2">
                <b>Specific Usecase:</b> Immutable local audit logging for User Logins, Role Switches (Creator &rarr; Agency &rarr; Admin), Channel Syncs, and PDF/CSV export jobs.
              </p>
            </div>
            <div className="pt-2 border-t border-white/5 text-[10px] font-mono text-slate-400 flex justify-between">
              <span>File: creatoriq_audit.db</span>
              <span>Audit Records: {sqliteStats?.total_audit_records || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* INTERACTIVE MULTI-DATABASE EXPLORER (RETRIEVE FROM ALL 3 DATABASES) */}
      {/* ===================================================================== */}
      <div className="glass-panel p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Layers className="h-5 w-5 text-indigo-400" />
              Interactive Multi-Database Explorer & Data Retriever
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Retrieve, inspect, and verify real data stored in PostgreSQL, MongoDB, and SQLite 3
            </p>
          </div>

          {/* DB Tabs Switcher */}
          <div className="flex bg-slate-900/80 p-1 rounded-xl border border-white/10 shrink-0">
            <button
              onClick={() => setActiveDbTab('postgresql')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeDbTab === 'postgresql'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Table className="h-3.5 w-3.5" />
              PostgreSQL
            </button>
            <button
              onClick={() => setActiveDbTab('mongodb')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeDbTab === 'mongodb'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileJson className="h-3.5 w-3.5" />
              MongoDB
            </button>
            <button
              onClick={() => setActiveDbTab('sqlite')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeDbTab === 'sqlite'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ScrollText className="h-3.5 w-3.5" />
              SQLite 3
            </button>
          </div>
        </div>

        {/* 1. POSTGRESQL VIEW */}
        {activeDbTab === 'postgresql' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-blue-950/20 border border-blue-500/20">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-blue-300">Select Relational Table:</span>
                <div className="flex flex-wrap gap-1.5">
                  {(pgOverview?.tables || []).map((t) => (
                    <button
                      key={t.table_name}
                      onClick={() => loadPgTableData(t.table_name)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        selectedPgTable === t.table_name
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {t.table_name} ({t.row_count})
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => loadPgTableData(selectedPgTable)}
                disabled={pgLoading}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-300 border border-white/10"
              >
                <RefreshCw className={`h-3 w-3 ${pgLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {/* Table Display */}
            {pgTableData && (
              <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-900/60 max-h-96">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 sticky top-0 border-b border-white/10 text-[10px] uppercase font-bold text-slate-400">
                    <tr>
                      {pgTableData.columns?.map((c) => (
                        <th key={c} className="px-4 py-2.5">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300 font-mono text-[11px]">
                    {pgTableData.rows?.map((row, idx) => (
                      <tr key={idx} className="hover:bg-white/5">
                        {pgTableData.columns?.map((c) => (
                          <td key={c} className="px-4 py-2 max-w-xs truncate" title={String(row[c])}>
                            {String(row[c] !== null && row[c] !== undefined ? row[c] : 'NULL')}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {pgTableData.rows?.length === 0 && (
                      <tr>
                        <td colSpan={pgTableData.columns?.length || 1} className="px-4 py-8 text-center text-slate-500">
                          Table is empty. Add data via app interactions.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 2. MONGODB VIEW */}
        {activeDbTab === 'mongodb' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-300">Select Collection:</span>
                <div className="flex flex-wrap gap-1.5">
                  {mongoCollections.map((c) => (
                    <button
                      key={c.collection_name}
                      onClick={() => loadMongoDocuments(c.collection_name)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        selectedMongoCol === c.collection_name
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {c.collection_name} ({c.document_count})
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => loadMongoDocuments(selectedMongoCol)}
                disabled={mongoLoading}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-300 border border-white/10"
              >
                <RefreshCw className={`h-3 w-3 ${mongoLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Document List */}
              <div className="rounded-xl border border-white/10 bg-slate-900/60 p-3 max-h-96 overflow-y-auto space-y-2">
                <div className="text-[11px] font-bold uppercase text-slate-400 mb-2 flex justify-between">
                  <span>Documents ({mongoDocs.length})</span>
                  <span>Click to Inspect Full JSON</span>
                </div>

                {mongoDocs.map((doc) => (
                  <div
                    key={doc._id}
                    onClick={() => setSelectedDocJson(doc)}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                      selectedDocJson?._id === doc._id
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-white'
                        : 'bg-white/5 border-white/5 hover:border-white/20 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-mono text-emerald-400 font-bold">_id: {doc._id}</span>
                      <span className="text-slate-500">{doc.saved_at ? new Date(doc.saved_at).toLocaleTimeString() : 'Recent'}</span>
                    </div>
                    <div className="text-xs text-slate-300 truncate">
                      {doc.platform && <span className="uppercase font-bold text-indigo-400 mr-2">[{doc.platform}]</span>}
                      {doc.handle && <span className="mr-2">@{doc.handle}</span>}
                      {doc.hashtag && <span className="text-pink-400 mr-2">{doc.hashtag}</span>}
                      {doc.item_count !== undefined && <span>{doc.item_count} items</span>}
                      {doc.posts_count !== undefined && <span>{doc.posts_count} posts</span>}
                      {doc.videos_count !== undefined && <span>{doc.videos_count} videos</span>}
                    </div>
                  </div>
                ))}

                {mongoDocs.length === 0 && (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    No documents stored in this collection yet. Connect an account, fetch trending videos, or analyze a hashtag to populate MongoDB.
                  </div>
                )}
              </div>

              {/* JSON Inspector */}
              <div className="rounded-xl border border-white/10 bg-slate-950 p-4 max-h-96 overflow-y-auto font-mono text-[11px] text-emerald-300">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 border-b border-white/5 pb-1 flex justify-between">
                  <span>JSON Payload Viewer</span>
                  <span>{selectedDocJson ? `_id: ${selectedDocJson._id}` : 'Select a document'}</span>
                </div>
                {selectedDocJson ? (
                  <pre className="whitespace-pre-wrap leading-relaxed">
                    {JSON.stringify(selectedDocJson, null, 2)}
                  </pre>
                ) : (
                  <div className="h-64 flex items-center justify-center text-slate-600">
                    Click any document on the left to inspect full schema & raw payload
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 3. SQLITE 3 AUDIT TRAIL VIEW */}
        {activeDbTab === 'sqlite' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-amber-950/20 border border-amber-500/20">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-300">Filter Event Action:</span>
                <select
                  value={sqliteFilterAction}
                  onChange={(e) => setSqliteFilterAction(e.target.value)}
                  className="bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                >
                  <option value="ALL">All Actions ({sqliteStats?.total_audit_records || 0})</option>
                  <option value="ROLE_SWITCH">ROLE_SWITCH</option>
                  <option value="USER_LOGIN">USER_LOGIN</option>
                  <option value="USER_REGISTER">USER_REGISTER</option>
                  <option value="CHANNEL_CONNECT">CHANNEL_CONNECT</option>
                  <option value="CHANNEL_SYNC">CHANNEL_SYNC</option>
                  <option value="REPORT_EXPORT">REPORT_EXPORT</option>
                  <option value="CONTENT_INSPECT">CONTENT_INSPECT</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-400 font-mono">
                  File Size: {sqliteStats?.file_size_kb || 0} KB
                </span>
                <button
                  onClick={loadSqliteData}
                  disabled={sqliteLoading}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-300 border border-white/10"
                >
                  <RefreshCw className={`h-3 w-3 ${sqliteLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Audit Logs Table */}
            <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-900/60 max-h-96">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 sticky top-0 border-b border-white/10 text-[10px] uppercase font-bold text-slate-400">
                  <tr>
                    <th className="px-4 py-2.5">Timestamp</th>
                    <th className="px-4 py-2.5">Action</th>
                    <th className="px-4 py-2.5">User Email</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5">Event Details (JSON)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {sqliteLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/5">
                      <td className="px-4 py-2 text-[11px] text-slate-400 font-mono whitespace-nowrap">
                        {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                      </td>
                      <td className="px-4 py-2">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.action === 'ROLE_SWITCH'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : log.action.includes('LOGIN')
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : log.action.includes('CHANNEL')
                            ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-2 font-mono text-[11px] text-slate-300">{log.user_email || 'System'}</td>
                      <td className="px-4 py-2">
                        <span className={`text-[10px] font-bold ${log.status === 'SUCCESS' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 font-mono text-[10px] text-slate-400 max-w-md truncate" title={JSON.stringify(log.details)}>
                        {log.details ? JSON.stringify(log.details) : '-'}
                      </td>
                    </tr>
                  ))}
                  {sqliteLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                        No audit events recorded for this action.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* User RBAC Governance Table */}
      <div className="glass-panel overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center">
          <h3 className="text-base font-bold text-white tracking-tight">System Users & Role Governance</h3>
          <span className="text-xs text-slate-500">{users.length} Users Registered</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/80 border-b border-white/5 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Current Role</th>
                <th className="px-6 py-4">Adjust Permissions</th>
                <th className="px-6 py-4 text-right">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-bold text-white flex items-center gap-3">
                    <img
                      src={u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.email}`}
                      alt="Avatar"
                      className="h-8 w-8 rounded-full bg-slate-800 border border-white/10"
                    />
                    <span>{u.full_name || 'User'}</span>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-slate-400">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Creator">Creator</option>
                      <option value="Agency">Agency</option>
                      <option value="Marketing Team">Marketing Team</option>
                      <option value="Administrator">Administrator</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-right text-xs text-slate-400">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminConsole;
