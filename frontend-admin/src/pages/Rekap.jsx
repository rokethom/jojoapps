import { useState, useEffect } from "react";
import api from "../api/axios";
import {
  FiSearch, FiChevronDown, FiChevronUp, FiDollarSign, FiUser,
  FiRefreshCw, FiX, FiDownload, FiEye, FiCheck, FiClock,
  FiFilter,
} from "react-icons/fi";

const PERIOD_LIST = ["all", "5_days", "15_days", "30_days"];
const STATUS_LIST = ["all", "pending", "paid", "overdue"];

const PERIOD_CONFIG = {
  "5_days": "5 Hari",
  "15_days": "15 Hari",
  "30_days": "30 Hari",
};

const STATUS_CONFIG = {
  pending: { label: "Pending", bg: "#FEE2E2", color: "#DC2626" },
  paid: { label: "Paid", bg: "#DCFCE7", color: "#059669" },
  overdue: { label: "Overdue", bg: "#FEF3C7", color: "#D97706" },
};

export default function Rekap() {
  const [rekap, setRekap] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedDriver, setSelectedDriver] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [drivers, setDrivers] = useState([]);
  const [branchesList, setBranchesList] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchRekap = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (period !== "all") params.append("period", period);
      if (status !== "all") params.append("status", status);
      if (selectedDriver) params.append("driver_id", selectedDriver);
      if (selectedBranch) params.append("branch_id", selectedBranch);
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);

      const res = await api.get(`settlement/list_settlements/?${params.toString()}`);
      setRekap(res.data);
    } catch (err) {
      console.error("Failed to fetch rekap", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      const res = await api.get("users/users/");
      const data = Array.isArray(res.data) ? res.data : [];
      setDrivers(data.filter((user) => user.role === "driver"));
    } catch (err) {
      console.error("Failed to fetch drivers", err);
      setDrivers([]);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await api.get("branch/list/");
      const data = res.data.branches || res.data || [];
      setBranchesList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch branches", err);
      setBranchesList([]);
    }
  };

  useEffect(() => {
    fetchRekap();
  }, [period, status, selectedDriver, selectedBranch, startDate, endDate]);

  useEffect(() => {
    fetchDrivers();
    fetchBranches();
  }, []);

  const handleGenerateRekap = async () => {
    if (window.confirm("Generate rekap untuk semua driver? Data lama akan di-replace.")) {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (period !== "all") params.append("period", period);
        
        await api.get(`settlement/generate_settlement/?${params.toString()}`);
        fetchRekap();
        alert("Rekap berhasil di-generate!");
      } catch (err) {
        alert("Gagal generate rekap: " + (err.response?.data?.error || err.message));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleViewDetail = async (rekapId) => {
    try {
      setDetailLoading(true);
      const res = await api.get(`settlement/settlement_detail/?settlement_id=${rekapId}`);
      setSelectedDetail(res.data);
    } catch (err) {
      alert("Gagal load detail: " + err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleMarkPaid = async (rekapId) => {
    if (window.confirm("Tandai rekap ini sebagai sudah dibayar?")) {
      setActionLoading(rekapId);
      try {
        const res = await api.post(`settlement/mark_paid/`, { settlement_id: rekapId });
        setRekap(rekap.map(s => s.id === rekapId ? res.data : s));
        alert("Rekap marked as paid!");
      } catch (err) {
        alert("Gagal mark as paid: " + err.message);
      } finally {
        setActionLoading(null);
      }
    }
  };

  const handleExportExcel = async () => {
    try {
      const params = new URLSearchParams();
      if (period !== "all") params.append("period", period);
      if (status !== "all") params.append("status", status);
      if (selectedDriver) params.append("driver_id", selectedDriver);
      if (selectedBranch) params.append("branch_id", selectedBranch);
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);

      const response = await api.get(
        `settlement/export_excel/?${params.toString()}`,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `settlements_${new Date().toISOString().split("T")[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      alert("Gagal export: " + err.message);
    }
  };

  const filtered = rekap
    .filter((s) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        (s.driver_name || "").toLowerCase().includes(q) ||
        (s.branch_name || "").toLowerCase().includes(q) ||
        (s.period || "").toLowerCase().includes(q)
      );
    });

  const counts = {
    all: rekap.length,
    pending: rekap.filter(s => s.status === "pending").length,
    paid: rekap.filter(s => s.status === "paid").length,
    overdue: rekap.filter(s => s.status === "overdue").length,
  };

  const totalGross = rekap.reduce((sum, s) => sum + parseFloat(s.gross_total || 0), 0);
  const totalDeduction = rekap.reduce((sum, s) => sum + parseFloat(s.deduction_amount || 0), 0);
  const totalSettlement = rekap.reduce((sum, s) => sum + parseFloat(s.settlement_amount || 0), 0);

  return (
    <div className="animate-fade-in" style={pageWrap}>
      <style>{`
        .settlement-table-wrapper { overflow-x: auto; width: 100%; }
        .settlement-table th, .settlement-table td { white-space: nowrap; }
        .settlement-detail-table { min-width: 900px; }
        @media (max-width: 860px) {
          .settlement-header { flex-wrap: wrap; align-items: flex-start; }
          .settlement-actions { width: 100%; display: flex; flex-wrap: wrap; gap: 8px; }
          .settlement-actions button { width: 100%; }
          .settlement-filters { gap: 12px; }
          .settlement-search { width: 100%; }
        }
      `}</style>
      {/* HEADER */}
      <div style={header} className="settlement-header">
        <div>
          <h2 style={{ margin: 0, fontSize: "1.8rem", color: "var(--text-heading)", letterSpacing: "-0.02em" }}>
            Driver Rekap Report
          </h2>
          <p style={{ color: "var(--text-secondary)", marginTop: 4, fontSize: 15 }}>
            {rekap.length} rekap • Total: Rp {Number(totalSettlement).toLocaleString("id-ID")}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }} className="settlement-actions">
          <button style={refreshBtn} onClick={handleGenerateRekap} title="Generate Rekap">
            <FiRefreshCw /> Generate
          </button>
          <button style={{ ...refreshBtn, backgroundColor: "#10b981" }} onClick={handleExportExcel} title="Export to Excel">
            <FiDownload /> Export
          </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div style={kpiGrid}>
        <KpiCard
          icon={<FiDollarSign />}
          label="Total Gross"
          value={`Rp ${Number(totalGross).toLocaleString("id-ID")}`}
          color="#3B82F6"
        />
        <KpiCard
          icon={<FiDollarSign />}
          label="Total Deduction"
          value={`Rp ${Number(totalDeduction).toLocaleString("id-ID")}`}
          color="#EF4444"
        />
        <KpiCard
          icon={<FiDollarSign />}
          label="Total Rekap"
          value={`Rp ${Number(totalSettlement).toLocaleString("id-ID")}`}
          color="#10B981"
        />
        <KpiCard
          icon={<FiUser />}
          label="Pending Payment"
          value={counts.pending}
          color="#F59E0B"
        />
      </div>

      {/* FILTER TABS - PERIOD */}
      <div style={filterSection}>
        <label style={filterLabel}>Period:</label>
        <div style={filterRow}>
          {PERIOD_LIST.map((p) => (
            <button
              key={p}
              style={{
                ...filterTab,
                ...(period === p ? filterTabActive : {}),
              }}
              onClick={() => setPeriod(p)}
            >
              {p === "all" ? "All Periods" : PERIOD_CONFIG[p]}
            </button>
          ))}
        </div>
      </div>

      {/* FILTER TABS - STATUS */}
      <div style={filterSection}>
        <label style={filterLabel}>Status:</label>
        <div style={filterRow}>
          {STATUS_LIST.map((s) => (
            <button
              key={s}
              style={{
                ...filterTab,
                ...(status === s ? filterTabActive : {}),
              }}
              onClick={() => setStatus(s)}
            >
              {s === "all" ? "All Status" : STATUS_CONFIG[s]?.label || s}
              <span style={{
                ...countBadge,
                ...(status === s ? countBadgeActive : {}),
              }}>{counts[s]}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={filterSection} className="settlement-filters">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <div>
            <label style={filterLabel}>Driver</label>
            <select
              style={selectInput}
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
            >
              <option value="">All Drivers</option>
              {drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>{driver.name || driver.username}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={filterLabel}>Area / Branch</label>
            <select
              style={selectInput}
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
            >
              <option value="">All Areas</option>
              {branchesList.map((branch) => (
                <option key={branch.id} value={branch.id}>{branch.name} - {branch.area}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={filterLabel}>Start Date</label>
            <input
              type="date"
              style={selectInput}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div>
            <label style={filterLabel}>End Date</label>
            <input
              type="date"
              style={selectInput}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* SEARCH */}
      <div style={searchRow} className="settlement-search">
        <div style={searchBox}>
          <FiSearch style={{ color: "var(--text-muted)" }} />
          <input
            placeholder="Search by driver or branch name..."
            style={searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <FiX style={{ cursor: "pointer", color: "var(--text-muted)" }} onClick={() => setSearch("")} />
          )}
        </div>
      </div>

      {/* TABLE */}
      {loading ? (
        <div style={loadingBox}>
          <div style={spinner}></div>
          <style>{`@keyframes settlementSpin{to{transform:rotate(360deg)}}`}</style>
          <p style={{ color: "var(--text-muted)" }}>Loading settlements...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={emptyBox}>
          <FiFilter size={48} style={{ color: "var(--text-muted)" }} />
          <p style={{ color: "var(--text-muted)", marginTop: 12 }}>No settlements found</p>
        </div>
      ) : (
        <div style={tableCard} className="settlement-table-wrapper">
          <table className="settlement-table" style={{ ...tableStyle, minWidth: 940 }}>
            <thead>
              <tr>
                {["Driver", "Branch", "Period", "Orders", "Gross Total", "Deduction", "Settlement", "Status", "Actions"].map((h) => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((rekap) => (
                <RekapRow
                  key={rekap.id}
                  rekap={rekap}
                  expanded={expandedId === rekap.id}
                  onToggle={() => setExpandedId(expandedId === rekap.id ? null : rekap.id)}
                  onViewDetail={() => handleViewDetail(rekap.id)}
                  onMarkPaid={() => handleMarkPaid(rekap.id)}
                  busy={actionLoading === rekap.id}
                />
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} style={{ ...td, fontWeight: 600, textAlign: 'right', paddingRight: 16 }}>Totals</td>
                <td style={{ ...td, fontWeight: 600, color: 'var(--text-heading)' }}>Rp {Number(totalGross).toLocaleString('id-ID')}</td>
                <td style={{ ...td, fontWeight: 600, color: '#EF4444' }}>- Rp {Number(totalDeduction).toLocaleString('id-ID')}</td>
                <td style={{ ...td, fontWeight: 700, color: '#059669' }}>Rp {Number(totalSettlement).toLocaleString('id-ID')}</td>
                <td style={td}></td>
                <td style={td}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedDetail && (
        <SettlementDetailModal
          detail={selectedDetail}
          loading={detailLoading}
          onClose={() => setSelectedDetail(null)}
        />
      )}
    </div>
  );
}

// ================================================================
// SUB-COMPONENTS
// ================================================================

function KpiCard({ icon, label, value, color }) {
  return (
    <div style={{
      ...kpiCard,
      borderLeftColor: color,
    }}>
      <div style={{ fontSize: 28, color }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</div>
        <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text-heading)", marginTop: 4 }}>
          {typeof value === "number" ? value : value}
        </div>
      </div>
    </div>
  );
}

function RekapRow({ rekap, expanded, onToggle, onViewDetail, onMarkPaid, busy }) {
  const sc = STATUS_CONFIG[rekap.status] || STATUS_CONFIG.pending;
  const periodLabel = PERIOD_CONFIG[rekap.period] || rekap.period;

  const highOrders = Number(rekap.total_orders) >= 15;
  const deductionColor = Number(rekap.deduction_amount) > 10000 ? "#B91C1C" : "#EF4444";

  return (
    <tr style={trStyle} onClick={onToggle}>
      <td style={td}>
        <div style={driverInfo}>
          <div style={avatarCircle}>{rekap.driver_name.charAt(0)}</div>
          <div>
            <div style={{ fontWeight: 500, color: "var(--text-primary)" }}>{rekap.driver_name}</div>
          </div>
        </div>
      </td>
      <td style={td}>
        <span style={{ color: "var(--text-primary)", fontSize: 14 }}>{rekap.branch_name}</span>
      </td>
      <td style={td}>
        <span style={{
          padding: "4px 12px",
          borderRadius: 16,
          backgroundColor: "#EFF6FF",
          color: "#1E40AF",
          fontSize: 12,
          fontWeight: 500,
        }}>
          {periodLabel}
        </span>
      </td>
      <td style={td}>
        <span style={{ fontWeight: 600, color: highOrders ? "#059669" : "var(--text-primary)" }}>
          {rekap.total_orders}
        </span>
      </td>
      <td style={td}>
        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
          Rp {Number(rekap.gross_total).toLocaleString("id-ID")}
        </span>
      </td>
      <td style={td}>
        <span style={{ fontWeight: 600, color: deductionColor }}>
          - Rp {Number(rekap.deduction_amount).toLocaleString("id-ID")}
        </span>
      </td>
      <td style={td}>
        <span style={{ fontWeight: 700, color: "#059669", fontSize: 14 }}>
          Rp {Number(rekap.settlement_amount).toLocaleString("id-ID")}
        </span>
      </td>
      <td style={td}>
        <span style={{ ...badgeStyle, backgroundColor: sc.bg, color: sc.color }}>
          {sc.label}
        </span>
      </td>
      <td style={td}>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={(e) => { e.stopPropagation(); onViewDetail(); }}
            style={actionBtn}
            title="View Detail"
          >
            <FiEye size={14} />
          </button>
          {rekap.status !== "paid" && (
            <button
              onClick={(e) => { e.stopPropagation(); onMarkPaid(); }}
              style={{ ...actionBtn, color: busy ? "#999" : "#059669" }}
              disabled={busy}
              title="Mark as Paid"
            >
              {busy ? "..." : <FiCheck size={14} />}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

function SettlementDetailModal({ detail, loading, onClose }) {
  if (loading) {
    return (
      <div style={modalOverlay} onClick={onClose}>
        <div style={modalBox} onClick={(e) => e.stopPropagation()}>
          <div style={spinner}></div>
          <p style={{ color: "var(--text-muted)", marginTop: 12 }}>Loading detail...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={modalOverlay} onClick={onClose}>
      <div style={{ ...modalBox, maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div style={modalHeader}>
          <h3 style={{ margin: 0, color: "var(--text-heading)" }}>
            {detail.driver_name} - {PERIOD_CONFIG[detail.period] || detail.period}
          </h3>
          <button style={modalClose} onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div style={modalContent}>
          {/* SUMMARY */}
          <div style={summaryGrid}>
            <div style={summaryItem}>
              <div style={{ color: "var(--text-muted)", fontSize: 12 }}>Period</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-heading)", marginTop: 4 }}>
                {detail.period_start} to {detail.period_end}
              </div>
            </div>
            <div style={summaryItem}>
              <div style={{ color: "var(--text-muted)", fontSize: 12 }}>Total Orders</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-heading)", marginTop: 4 }}>
                {detail.total_orders}
              </div>
            </div>
            <div style={summaryItem}>
              <div style={{ color: "var(--text-muted)", fontSize: 12 }}>Base Tariff</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-heading)", marginTop: 4 }}>
                Rp {Number(detail.total_tarif).toLocaleString("id-ID")}
              </div>
            </div>
            <div style={summaryItem}>
              <div style={{ color: "var(--text-muted)", fontSize: 12 }}>Service Fee</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-heading)", marginTop: 4 }}>
                Rp {Number(detail.total_service_fee).toLocaleString("id-ID")}
              </div>
            </div>
          </div>

          {/* FINANCIAL SUMMARY */}
          <div style={{
            backgroundColor: "#F3F4F6",
            padding: 16,
            borderRadius: 12,
            marginTop: 20,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ color: "var(--text-muted)" }}>Gross Total:</span>
              <span style={{ fontWeight: 600, color: "var(--text-heading)" }}>
                Rp {Number(detail.gross_total).toLocaleString("id-ID")}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 12, borderBottom: "1px solid #E5E7EB", marginBottom: 12 }}>
              <span style={{ color: "#EF4444" }}>Deduction (20%):</span>
              <span style={{ fontWeight: 600, color: "#EF4444" }}>
                - Rp {Number(detail.deduction_amount).toLocaleString("id-ID")}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 600, color: "#059669", fontSize: 16 }}>Settlement Amount:</span>
              <span style={{ fontWeight: 700, color: "#059669", fontSize: 18 }}>
                Rp {Number(detail.settlement_amount).toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          {/* DETAIL ITEMS */}
          <div style={{ marginTop: 20 }}>
            <h4 style={{ color: "var(--text-heading)", marginBottom: 12 }}>Order Details</h4>
            <div style={{
              maxHeight: 400,
              overflowY: "auto",
              overflowX: "auto",
              border: "1px solid #E5E7EB",
              borderRadius: 8,
            }}>
              <table className="settlement-detail-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                        <th style={{ padding: 12, textAlign: "left", fontSize: 13, fontWeight: 600, color: "var(--text-heading)", position: 'sticky', top: 0, backgroundColor: '#F9FAFB', zIndex: 1 }}>Tanggal</th>
                    <th style={{ padding: 12, textAlign: "left", fontSize: 13, fontWeight: 600, color: "var(--text-heading)", position: 'sticky', top: 0, backgroundColor: '#F9FAFB', zIndex: 1 }}>Order ID</th>
                    <th style={{ padding: 12, textAlign: "left", fontSize: 13, fontWeight: 600, color: "var(--text-heading)", position: 'sticky', top: 0, backgroundColor: '#F9FAFB', zIndex: 1 }}>Jarak</th>
                    <th style={{ padding: 12, textAlign: "left", fontSize: 13, fontWeight: 600, color: "var(--text-heading)", position: 'sticky', top: 0, backgroundColor: '#F9FAFB', zIndex: 1 }}>Tarif Dasar</th>
                    <th style={{ padding: 12, textAlign: "left", fontSize: 13, fontWeight: 600, color: "var(--text-heading)", position: 'sticky', top: 0, backgroundColor: '#F9FAFB', zIndex: 1 }}>Service</th>
                    <th style={{ padding: 12, textAlign: "left", fontSize: 13, fontWeight: 600, color: "var(--text-heading)", position: 'sticky', top: 0, backgroundColor: '#F9FAFB', zIndex: 1 }}>Total</th>
                    <th style={{ padding: 12, textAlign: "left", fontSize: 13, fontWeight: 600, color: "var(--text-heading)", position: 'sticky', top: 0, backgroundColor: '#F9FAFB', zIndex: 1 }}>Potongan</th>
                    <th style={{ padding: 12, textAlign: "right", fontSize: 13, fontWeight: 600, color: "var(--text-heading)", position: 'sticky', top: 0, backgroundColor: '#F9FAFB', zIndex: 1 }}>Net Driver</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.detail_items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #F3F4F6" }}>
                      <td style={{ padding: 12, fontSize: 13, color: "var(--text-primary)" }}>
                        {item.order_date || item.created_at || "-"}
                      </td>
                      <td style={{ padding: 12, fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>
                        {item.order_code}
                      </td>
                      <td style={{ padding: 12, fontSize: 13, color: "var(--text-primary)" }}>
                        {item.distance ? `${item.distance} km` : "-"}
                      </td>
                      <td style={{ padding: 12, fontSize: 13, color: "var(--text-primary)" }}>
                        Rp {Number(item.tarif).toLocaleString("id-ID")}
                      </td>
                      <td style={{ padding: 12, fontSize: 13, color: "var(--text-primary)" }}>
                        Rp {Number(item.service_fee).toLocaleString("id-ID")}
                      </td>
                      <td style={{ padding: 12, fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>
                        Rp {Number(item.total_price).toLocaleString("id-ID")}
                      </td>
                      <td style={{ padding: 12, fontSize: 13, color: "#EF4444", fontWeight: 500 }}>
                        - Rp {Number(item.deduction).toLocaleString("id-ID")}
                      </td>
                      <td style={{ padding: 12, fontSize: 13, color: "#059669", fontWeight: 600, textAlign: "right" }}>
                        Rp {Number(item.settlement_amount).toLocaleString("id-ID")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ================================================================
// STYLES
// ================================================================

const pageWrap = {
  padding: "20px 24px",
  backgroundColor: "var(--bg-primary)",
  minHeight: "100vh",
};

const header = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 12,
  marginBottom: 32,
};

const refreshBtn = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 16px",
  borderRadius: 8,
  border: "none",
  backgroundColor: "#3B82F6",
  color: "white",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
  transition: "all 0.2s",
};

const kpiGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: 16,
  marginBottom: 32,
};

const kpiCard = {
  backgroundColor: "var(--bg-secondary)",
  padding: 20,
  borderRadius: 12,
  borderLeft: "4px solid #3B82F6",
  display: "flex",
  gap: 16,
  alignItems: "flex-start",
};

const filterSection = {
  marginBottom: 24,
};

const filterLabel = {
  display: "block",
  marginBottom: 8,
  fontSize: 14,
  fontWeight: 600,
  color: "var(--text-heading)",
};

const filterRow = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

const filterTab = {
  padding: "8px 16px",
  borderRadius: 8,
  border: "1px solid #E5E7EB",
  backgroundColor: "var(--bg-secondary)",
  color: "var(--text-secondary)",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
  transition: "all 0.2s",
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const filterTabActive = {
  backgroundColor: "#3B82F6",
  color: "white",
  borderColor: "#3B82F6",
};

const countBadge = {
  display: "inline-block",
  backgroundColor: "rgba(255,255,255,0.3)",
  paddingLeft: 6,
  paddingRight: 6,
  borderRadius: 10,
  fontSize: 12,
  fontWeight: 600,
};

const countBadgeActive = {
  backgroundColor: "rgba(0,0,0,0.2)",
};

const searchRow = {
  marginBottom: 24,
};

const searchBox = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "10px 16px",
  backgroundColor: "var(--bg-secondary)",
  borderRadius: 8,
  border: "1px solid #E5E7EB",
};

const searchInput = {
  flex: 1,
  border: "none",
  backgroundColor: "transparent",
  outline: "none",
  fontSize: 14,
  color: "var(--text-primary)",
};

const loadingBox = {
  textAlign: "center",
  padding: 60,
  backgroundColor: "var(--bg-secondary)",
  borderRadius: 12,
};

const spinner = {
  width: 40,
  height: 40,
  borderRadius: "50%",
  border: "3px solid #E5E7EB",
  borderTop: "3px solid #3B82F6",
  animation: "settlementSpin 1s linear infinite",
  margin: "0 auto",
};

const emptyBox = {
  textAlign: "center",
  padding: 60,
  backgroundColor: "var(--bg-secondary)",
  borderRadius: 12,
};

const tableCard = {
  backgroundColor: "var(--bg-secondary)",
  borderRadius: 12,
  overflow: "hidden",
  border: "1px solid #E5E7EB",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
};

const th = {
  padding: "16px 20px",
  textAlign: "left",
  backgroundColor: "var(--bg-primary)",
  color: "var(--text-muted)",
  fontSize: 12,
  fontWeight: 700,
  textTransform: "uppercase",
  borderBottom: "2px solid #E5E7EB",
  letterSpacing: "0.5px",
  position: "sticky",
  top: 0,
  zIndex: 2,
};

const selectInput = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #D1D5DB",
  backgroundColor: "var(--bg-primary)",
  color: "var(--text-primary)",
  fontSize: 14,
};

const trStyle = {
  borderBottom: "1px solid #E5E7EB",
  hover: { backgroundColor: "var(--bg-primary)" },
};

const td = {
  padding: "16px 20px",
  fontSize: 14,
  color: "var(--text-primary)",
};

const driverInfo = {
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const avatarCircle = {
  width: 36,
  height: 36,
  borderRadius: "50%",
  backgroundColor: "#E0E7FF",
  color: "#4F46E5",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 600,
  fontSize: 14,
};

const badgeStyle = {
  padding: "4px 12px",
  borderRadius: 16,
  fontSize: 12,
  fontWeight: 500,
};

const actionBtn = {
  padding: "6px 10px",
  borderRadius: 6,
  border: "1px solid #E5E7EB",
  backgroundColor: "var(--bg-secondary)",
  color: "#3B82F6",
  cursor: "pointer",
  fontSize: 14,
  transition: "all 0.2s",
  display: "flex",
  alignItems: "center",
  gap: 4,
};

const modalOverlay = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modalBox = {
  backgroundColor: "var(--bg-secondary)",
  borderRadius: 12,
  width: "90%",
  maxWidth: "800px",
  boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
};

const modalHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "20px 24px",
  borderBottom: "1px solid #E5E7EB",
};

const modalClose = {
  background: "none",
  border: "none",
  fontSize: 24,
  color: "var(--text-muted)",
  cursor: "pointer",
  padding: 0,
};

const modalContent = {
  padding: 24,
};

const summaryGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: 16,
};

const summaryItem = {
  backgroundColor: "#F9FAFB",
  padding: 12,
  borderRadius: 8,
};
