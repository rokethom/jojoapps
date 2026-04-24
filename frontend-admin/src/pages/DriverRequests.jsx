import { useEffect, useState, useMemo } from "react";
import API from "../api/axios";

// Function to parse revenue from text with various formats
const parseRevenue = (text) => {
  if (!text) return 0;

  // Convert to lowercase for easier matching
  const lowerText = text.toLowerCase();

  // Patterns to match various number formats
  const patterns = [
    // Direct numbers: 7000, 7500, etc.
    /\b(\d{1,3}(?:,\d{3})*|\d+)\b/g,
    // K format: 7k, 7.5k, 15k
    /\b(\d+(?:\.\d+)?)\s*k\b/g,
    // RB format: 7rb, 7.5rb
    /\b(\d+(?:\.\d+)?)\s*rb\b/g,
    // JT format: 7jt, 1.5jt
    /\b(\d+(?:\.\d+)?)\s*jt\b/g,
    // M format: 7m, 1.5m
    /\b(\d+(?:\.\d+)?)\s*m\b/g,
  ];

  let revenue = 0;
  let found = false;

  for (const pattern of patterns) {
    const matches = lowerText.match(pattern);
    if (matches) {
      for (const match of matches) {
        let numStr = match.replace(/[^\d.]/g, ''); // Remove non-numeric except decimal
        let num = parseFloat(numStr);

        if (!isNaN(num)) {
          // Apply multipliers based on format
          if (lowerText.includes('jt') && match.includes('jt')) {
            num *= 1000000; // jutaan
          } else if (lowerText.includes('m') && match.includes('m')) {
            num *= 1000000; // million
          } else if (lowerText.includes('k') && match.includes('k')) {
            num *= 1000; // ribuan
          } else if (lowerText.includes('rb') && match.includes('rb')) {
            num *= 1000; // ribuan
          }

          // Take the highest value found (assuming it's the main revenue)
          if (num > revenue) {
            revenue = num;
            found = true;
          }
        }
      }
    }
  }

  // If no specific pattern found, try to find any number after keywords
  if (!found) {
    const keywordPatterns = [
      /(?:jasa|biaya|harga|fee|tarif|ongkos)\s*:?\s*(\d+(?:[,.]\d+)*)/gi,
      /(?:jasa|biaya|harga|fee|tarif|ongkos)\s+(\d+(?:[,.]\d+)*)/gi,
      /rp\.?\s*(\d+(?:[,.]\d+)*)/gi,
      /(\d+(?:[,.]\d+)*)\s*(?:ribu|rb)/gi,
    ];

    for (const pattern of keywordPatterns) {
      const match = lowerText.match(pattern);
      if (match && match[1]) {
        let numStr = match[1].replace(/,/g, '');
        let num = parseFloat(numStr);
        if (!isNaN(num)) {
          if (lowerText.includes('ribu') || lowerText.includes('rb')) {
            num *= 1000;
          }
          revenue = num;
          found = true;
          break;
        }
      }
    }
  }

  return Math.round(revenue); // Round to nearest integer
};

export default function DriverRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await API.get("/orders/driver_requests/");
      setRequests(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const driverStats = {};
    let totalRequests = 0;
    let totalRevenue = 0;

    requests.forEach(request => {
      const driverId = request.driver;
      const driverName = request.driver_name;

      if (!driverStats[driverId]) {
        driverStats[driverId] = {
          name: driverName,
          count: 0,
          revenue: 0,
          requests: []
        };
      }

      driverStats[driverId].count += 1;
      driverStats[driverId].requests.push(request);

      // Extract revenue from text using advanced parsing
      const revenue = parseRevenue(request.text);
      if (revenue > 0) {
        driverStats[driverId].revenue += revenue;
        totalRevenue += revenue;
      }

      totalRequests += 1;
    });

    return {
      totalRequests,
      totalRevenue,
      driverStats: Object.values(driverStats)
    };
  }, [requests]);

  return (
    <div style={{
      padding: 20,
      backgroundColor: "var(--bg-body)",
      color: "var(--text-primary)",
      minHeight: "100vh"
    }}>
      <h2 style={{
        marginBottom: 20,
        color: "var(--text-heading)"
      }}>📋 Driver Requests</h2>

      {/* Statistics Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 20,
        marginBottom: 30
      }}>
        <div style={{
          backgroundColor: "var(--bg-card)",
          padding: 20,
          borderRadius: 12,
          boxShadow: "var(--shadow-md)",
          border: "1px solid var(--card-border)",
          textAlign: "center"
        }}>
          <div style={{
            fontSize: 24,
            fontWeight: "bold",
            color: "var(--info)"
          }}>
            {stats.totalRequests}
          </div>
          <div style={{
            color: "var(--text-secondary)",
            marginTop: 5
          }}>Total Requests</div>
        </div>

        <div style={{
          backgroundColor: "var(--bg-card)",
          padding: 20,
          borderRadius: 12,
          boxShadow: "var(--shadow-md)",
          border: "1px solid var(--card-border)",
          textAlign: "center"
        }}>
          <div style={{
            fontSize: 24,
            fontWeight: "bold",
            color: "var(--success)"
          }}>
            Rp {stats.totalRevenue.toLocaleString()}
          </div>
          <div style={{
            color: "var(--text-secondary)",
            marginTop: 5
          }}>Total Revenue</div>
        </div>

        <div style={{
          backgroundColor: "var(--bg-card)",
          padding: 20,
          borderRadius: 12,
          boxShadow: "var(--shadow-md)",
          border: "1px solid var(--card-border)",
          textAlign: "center"
        }}>
          <div style={{
            fontSize: 24,
            fontWeight: "bold",
            color: "var(--warning)"
          }}>
            {stats.driverStats.length}
          </div>
          <div style={{
            color: "var(--text-secondary)",
            marginTop: 5
          }}>Active Drivers</div>
        </div>
      </div>

      {/* Driver Statistics */}
      <div style={{ marginBottom: 30 }}>
        <h3 style={{
          marginBottom: 15,
          color: "var(--text-heading)"
        }}>Driver Statistics</h3>
        <div style={{
          display: "grid",
          gap: 15
        }}>
          {stats.driverStats.map((driver, index) => (
            <div key={index} style={{
              backgroundColor: "var(--bg-card)",
              padding: 20,
              borderRadius: 12,
              boxShadow: "var(--shadow-md)",
              border: "1px solid var(--card-border)",
            }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 15
              }}>
                <h4 style={{
                  margin: 0,
                  color: "var(--text-heading)"
                }}>{driver.name}</h4>
                <div style={{ textAlign: "right" }}>
                  <div style={{
                    fontSize: 18,
                    fontWeight: "bold",
                    color: "var(--info)"
                  }}>
                    {driver.count} requests
                  </div>
                  <div style={{
                    fontSize: 14,
                    color: "var(--success)"
                  }}>
                    Rp {driver.revenue.toLocaleString()}
                  </div>
                </div>
              </div>

              <div style={{
                display: "grid",
                gap: 10,
                maxHeight: 200,
                overflowY: "auto"
              }}>
                {driver.requests.map((request, reqIndex) => {
                  const revenue = parseRevenue(request.text);
                  return (
                    <div key={reqIndex} style={{
                      backgroundColor: "var(--bg-card-hover)",
                      padding: 12,
                      borderRadius: 8,
                      borderLeft: `3px solid var(--accent)`,
                    }}>
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "start",
                        marginBottom: 5
                      }}>
                        <div style={{
                          fontSize: 12,
                          color: "var(--text-secondary)"
                        }}>
                          {new Date(request.created_at).toLocaleDateString("id-ID", {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        {revenue > 0 && (
                          <div style={{
                            backgroundColor: "var(--success)",
                            color: "#fff",
                            padding: "2px 8px",
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: "bold"
                          }}>
                            Rp {revenue.toLocaleString()}
                          </div>
                        )}
                      </div>
                      <div style={{
                        whiteSpace: "pre-wrap",
                        lineHeight: 1.4,
                        fontSize: 14,
                        color: "var(--text-primary)"
                      }}>
                        {request.text}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* All Requests List */}
      <div>
        <h3 style={{
          marginBottom: 15,
          color: "var(--text-heading)"
        }}>All Requests</h3>
        {loading ? (
          <div style={{
            textAlign: "center",
            color: "var(--text-secondary)"
          }}>Loading...</div>
        ) : requests.length === 0 ? (
          <div style={{
            backgroundColor: "var(--bg-card)",
            padding: 40,
            borderRadius: 12,
            border: "1px solid var(--card-border)",
            textAlign: "center",
            color: "var(--text-secondary)"
          }}>
            No driver requests found
          </div>
        ) : (
          <div style={{
            display: "grid",
            gap: 15
          }}>
            {requests.map((request) => (
              <div key={request.id} style={{
                backgroundColor: "var(--bg-card)",
                padding: 20,
                borderRadius: 12,
                boxShadow: "var(--shadow-md)",
                border: "1px solid var(--card-border)",
              }}>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "start",
                  marginBottom: 15
                }}>
                  <div>
                    <h4 style={{
                      margin: 0,
                      marginBottom: 5,
                      color: "var(--text-heading)"
                    }}>{request.driver_name}</h4>
                    <div style={{
                      fontSize: 12,
                      color: "var(--text-secondary)"
                    }}>
                      {new Date(request.created_at).toLocaleDateString("id-ID", {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  {(() => {
                    const revenue = parseRevenue(request.text);
                    return revenue > 0 ? (
                      <div style={{
                        backgroundColor: "var(--success)",
                        color: "#fff",
                        padding: "6px 12px",
                        borderRadius: 20,
                        fontSize: 14,
                        fontWeight: "bold",
                        display: "flex",
                        alignItems: "center",
                        gap: 5
                      }}>
                        💰 Rp {revenue.toLocaleString()}
                      </div>
                    ) : null;
                  })()}
                </div>

                <div style={{
                  backgroundColor: "var(--bg-card-hover)",
                  padding: 15,
                  borderRadius: 8,
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.5,
                  color: "var(--text-primary)"
                }}>
                  {request.text}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}