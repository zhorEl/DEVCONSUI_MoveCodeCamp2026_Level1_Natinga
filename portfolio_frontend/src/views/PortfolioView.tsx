import { useState, useEffect } from "react";

// ============================================================================
// CUSTOM HOOK FOR DYNAMIC META TAGS
// ============================================================================
const useMetaTags = (metadata: {
  title: string;
  description: string;
  image: string;
  url: string;
  keywords?: string;
}) => {
  useEffect(() => {
    // Update document title
    document.title = metadata.title;

    // Update or create meta tags
    const metaTags = [
      { name: "title", content: metadata.title },
      { name: "description", content: metadata.description },
      { property: "og:title", content: metadata.title },
      { property: "og:description", content: metadata.description },
      { property: "og:image", content: metadata.image },
      { property: "og:url", content: metadata.url },
      { property: "twitter:title", content: metadata.title },
      { property: "twitter:description", content: metadata.description },
      { property: "twitter:image", content: metadata.image },
      { name: "keywords", content: metadata.keywords || "" },
    ];

    metaTags.forEach((tag) => {
      const selector =
        "property" in tag
          ? `meta[property="${tag.property}"]`
          : `meta[name="${tag.name}"]`;

      let element = document.querySelector(selector) as HTMLMetaElement;

      if (!element) {
        // Create element if it doesn't exist
        element = document.createElement("meta");
        if ("property" in tag) {
          element.setAttribute("property", tag.property);
        } else {
          element.setAttribute("name", tag.name);
        }
        document.head.appendChild(element);
      }

      element.content = tag.content;
    });

    // Update canonical link
    let canonicalLink = document.querySelector(
      'link[rel="canonical"]',
    ) as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.rel = "canonical";
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = metadata.url;
  }, [metadata]);
};

// ============================================================================
// PORTFOLIO DATA CONFIGURATION
// ============================================================================
const defaultPortfolioData = {
  name: "LADY DIANE BAUZON CASILANG",
  course: "BS in Information Technology",
  school: "FEU Institute of Technology",
  about:
    "I am a fourth-year IT student and freelance designer who integrates technical troubleshooting with creative insight to deliver innovative, efficient solutions.",
  skills: [
    "Graphic Design",
    "UI / UX Design",
    "Project Management",
    "Full Stack Development",
    "Web & App Development",
  ],
  linkedin: "https://www.linkedin.com/in/ldcasilang/",
  github: "https://github.com/ldcasilang",
};

// Network configuration
const NETWORKS = {
  testnet: {
    name: "Testnet",
    fullnode: "https://fullnode.testnet.sui.io",
    explorer: "https://suiscan.xyz/testnet",
  },
  mainnet: {
    name: "Mainnet",
    fullnode: "https://fullnode.mainnet.sui.io",
    explorer: "https://suiscan.xyz/mainnet",
  },
};

const PortfolioView = () => {
  // ==========================================================================
  // STATE MANAGEMENT
  // ==========================================================================
  const objectId =
    "0xc38dab74f70f3aa0a4ca0ac2c11606260d1953e08ab0e11979dbdedbf3770f96";

  // Network state - default to testnet, can be changed if needed
  const [currentNetwork, setCurrentNetwork] = useState<"testnet" | "mainnet">(
    "mainnet",
  );

  const [portfolioData, setPortfolioData] = useState(defaultPortfolioData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [transactionId, setTransactionId] = useState(""); // NEW: Store transaction ID

  // ==========================================================================
  // DYNAMIC META TAGS
  // ==========================================================================
  // Generate dynamic meta data based on portfolio
  const metaData = {
    title: `${portfolioData.name} | Sui Move Smart Contract Portfolio`,
    description: `${portfolioData.about.substring(0, 150)}...`,
    image: `${window.location.origin}/meta-devcon-sui.png`, // Changed to meta-devcon-sui.png
    url: window.location.href,
    keywords: `Sui Move, ${portfolioData.skills.join(", ")}, blockchain, ${portfolioData.course}, ${portfolioData.school}, smart contracts`,
  };

  // Apply the meta tags
  useMetaTags(metaData);

  // ==========================================================================
  // FETCH DATA FROM BLOCKCHAIN
  // ==========================================================================
  useEffect(() => {
    const fetchPortfolioData = async () => {
      try {
        setIsLoading(true);

        const network = NETWORKS[currentNetwork];

        const response = await fetch(network.fullnode, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "sui_getObject",
            params: [
              objectId,
              {
                showContent: true,
                showOwner: true,
                showPreviousTransaction: true, // This shows the transaction ID
                showStorageRebate: true,
                showDisplay: true,
                showBcs: false,
                showType: true,
              },
            ],
          }),
        });

        const result = await response.json();

        if (result.error) {
          throw new Error(
            result.error.message || "Failed to fetch from blockchain",
          );
        }

        if (result.result?.data) {
          // Store the transaction ID from the response
          if (result.result.data.previousTransaction) {
            setTransactionId(result.result.data.previousTransaction);
          }

          if (result.result.data.content?.fields) {
            const fields = result.result.data.content.fields;

            const newPortfolioData = {
              name: fields.name || defaultPortfolioData.name,
              course: fields.course || defaultPortfolioData.course,
              school: fields.school || defaultPortfolioData.school,
              about: fields.about || defaultPortfolioData.about,
              linkedin: fields.linkedin_url || defaultPortfolioData.linkedin,
              github: fields.github_url || defaultPortfolioData.github,
              skills: fields.skills
                ? fields.skills.split(",").map((s) => s.trim())
                : defaultPortfolioData.skills,
            };

            setPortfolioData(newPortfolioData);
          } else {
            throw new Error("No portfolio data found in object");
          }
        } else {
          throw new Error("No data returned from blockchain");
        }
      } catch (err) {
        console.log("Using default data. Blockchain fetch failed:", err);
        setError(
          `Note: Using default data (blockchain fetch failed: ${err instanceof Error ? err.message : "Unknown error"})`,
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchPortfolioData();
  }, [objectId, currentNetwork]);

  // Helper function to truncate transaction ID for display
  const truncateTxId = (txId: string) => {
    if (txId.length <= 10) return txId;
    return `${txId.slice(0, 8)}...${txId.slice(-4)}`;
  };

  // Network toggle handler (optional - you can remove if you don't need network switching)
  const toggleNetwork = () => {
    setCurrentNetwork((prev) => (prev === "testnet" ? "mainnet" : "testnet"));
  };

  // ==========================================================================
  // COMPONENT RENDER - MAIN PORTFOLIO LAYOUT
  // ==========================================================================
  return (
    <>
      {/* Loading indicator */}
      {isLoading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            background: "#667eea",
            color: "white",
            padding: "10px",
            textAlign: "center",
            zIndex: 1000,
          }}
        >
          Loading from {NETWORKS[currentNetwork].name}...
        </div>
      )}

      {/* Error message */}
      {error && (
        <div
          style={{
            background: "#fff3cd",
            color: "#856404",
            padding: "1rem",
            margin: "1rem",
            borderRadius: "8px",
            border: "1px solid #ffeaa7",
            textAlign: "center",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* ===================================================================== */}
      {/* HERO SECTION - Profile and Introduction */}
      {/* ===================================================================== */}
      <div className="hero-wrapper">
        <div className="hero">
          {/* Profile Image - Static local image only */}
          <div className="avatar">
            <img
              src="/profile.png"
              alt={portfolioData.name}
              crossOrigin="anonymous"
              style={{
                border: "none",
                opacity: 1,
              }}
            />
          </div>

          {/* Personal Information */}
          <div className="hero-content">
            <small>Hello! My name is</small>
            <h1 className="gradient-name">{portfolioData.name}</h1>
            <p>
              <span className="degree">
                {portfolioData.course}, {portfolioData.school}
              </span>
            </p>

            {/* Social Media Links */}
            <div className="socials">
              <a
                href={portfolioData.linkedin}
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fa-brands fa-linkedin"></i> LinkedIn
              </a>
              <a
                href={portfolioData.github}
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fa-brands fa-github"></i> GitHub
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* ABOUT ME & SKILLS SECTION */}
      {/* ===================================================================== */}
      <section className="solid-section">
        <h2>About Me</h2>
        <p>{portfolioData.about}</p>

        <h2>Skills</h2>
        {/* Skills Grid - Maps through skills array */}
        <div className="skills">
          {portfolioData.skills.map((skill, index) => (
            <div key={index} className="skill">
              {skill}
            </div>
          ))}
        </div>
      </section>

      {/* ===================================================================== */}
      {/* MOVE SMART CONTRACTS - Educational Section */}
      {/* ===================================================================== */}
      <div className="move-wrapper">
        <div className="move-card">
          <div className="move-title">
            <img src="/sui-logo.png" alt="Move Logo" className="move-logo" />
            <strong>About Move Smart Contracts</strong>
          </div>

          {/* Educational Content about Move Language */}
          <p>
            Sui is a high-performance Layer 1 blockchain engineered for
            industry-leading speed and horizontal scalability. Headquartered in
            Silicon Valley (Palo Alto, California), the network was built by
            Mysten Labs—a team founded by the original creators of the Move
            language with roots at Facebook (Meta) and the Diem project. By
            utilizing a unique object-centric data model and the secure Move
            programming language, Sui provides a robust infrastructure that
            slashes the Web3 learning curve. This foundation allows developers
            to manage assets with enhanced security and build scalable
            applications that can redefine the future of the internet.
          </p>

          {/* External Link to Official Sui Documentation */}
          <a
            href="https://www.sui.io/move"
            target="_blank"
            className="learn-more-btn"
            rel="noopener noreferrer"
          >
            Learn More About Sui →
          </a>
        </div>

        {/* Empty move-footer - Can be used for additional content if needed */}
        <div className="move-footer">
          <p></p>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* FOOTER - Attribution and Logos */}
      {/* ===================================================================== */}
      <div className="custom-footer">
        <div
          className="footer-container"
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "2rem 2rem",
            display: "flex",
            flexDirection: "column", // Stack items vertically
            alignItems: "flex-start", // Left align everything
            gap: "1.5rem",
            flexWrap: "wrap",
          }}
        >
          {/* Organization Logos - Left aligned */}
          <div
            className="footer-logos"
            style={{
              display: "flex",
              gap: "2rem", // Increased gap slightly
              alignItems: "center",
              justifyContent: "flex-start", // Left align logos
              width: "100%",
            }}
          >
            <a
              href="https://devcon.ph/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                transition: "all 0.3s ease",
                borderRadius: "12px",
                padding: "8px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.border = "2px solid #3B82F6";
                e.currentTarget.style.backgroundColor =
                  "rgba(59, 130, 246, 0.1)";
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.border = "2px solid transparent";
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <img
                src="/devcon.png"
                alt="DEVCON"
                className="logo-img"
                style={{
                  height: "30px", // Increased from 40px to 60px (50% larger)
                  width: "auto",
                }}
              />
            </a>
            <a
              href="https://sui.io/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                transition: "all 0.3s ease",
                borderRadius: "12px",
                padding: "8px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.border = "2px solid #3B82F6";
                e.currentTarget.style.backgroundColor =
                  "rgba(108, 142, 239, 0.1)";
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.border = "2px solid transparent";
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <img
                src="/sui.png"
                alt="SUI"
                className="logo-img"
                style={{
                  height: "30px", // Kept at 40px
                  width: "auto",
                }}
              />
            </a>
          </div>

          {/* Code Camp Attribution Text - Left aligned */}
          <div
            className="footer-text"
            style={{
              width: "100%",
              maxWidth: "1000px",
              textAlign: "left", // Left align text
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "0.9rem",
                lineHeight: "1.6",
                color: "#ffffff",
                textAlign: "left", // Left align
                maxWidth: "100%",
                fontWeight: 400,
                letterSpacing: "0.01em",
              }}
            >
              <span style={{ fontWeight: 600, color: "#ffffff" }}>
                Proof of Learning Portfolio
              </span>{" "}
              project proudly built and published with informed consent during a{" "}
              <span style={{ fontWeight: 500, color: "#ffffff" }}>
                Move Smart Contracts Code Camp
              </span>{" "}
              by DEVCON Philippines & Sui Foundation — where the participant
              wrote, tested, and deployed a Move smart contract on Sui Mainnet.
              The object's immutability serves one purpose: the participant's
              authorship and timestamp cannot be altered, removed, or claimed by
              anyone else.
            </p>

            {/* Project Deployment Links - Left aligned */}
            <div
              style={{
                display: "flex",
                gap: "1.5rem",
                justifyContent: "flex-start", // Left align buttons
                alignItems: "center",
                flexWrap: "wrap",
                marginTop: "1.2rem",
              }}
            >
              {/* Object Link - DYNAMIC */}
              {objectId ? (
                <a
                  href={`${NETWORKS[currentNetwork].explorer}/object/${objectId}/fields`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "#6C8EEF",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    padding: "0.5rem 1rem",
                    borderRadius: "6px",
                    border: "1px solid rgba(108, 142, 239, 0.3)",
                    backgroundColor: "rgba(108, 142, 239, 0.05)",
                    fontSize: "0.9rem",
                    fontWeight: 500,
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "rgba(108, 142, 239, 0.1)";
                    e.currentTarget.style.borderColor = "#6C8EEF";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "rgba(108, 142, 239, 0.05)";
                    e.currentTarget.style.borderColor =
                      "rgba(108, 142, 239, 0.3)";
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 2L2 7L12 12L22 7L12 2Z"
                      stroke="#6C8EEF"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M2 17L12 22L22 17"
                      stroke="#6C8EEF"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M2 12L12 17L22 12"
                      stroke="#6C8EEF"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Verify on Blockchain
                </a>
              ) : (
                <div
                  style={{
                    color: "#ffffff",
                    fontSize: "0.9rem",
                    padding: "0.5rem 1rem",
                    borderRadius: "6px",
                    border: "1px solid rgba(102, 102, 102, 0.2)",
                    backgroundColor: "rgba(102, 102, 102, 0.05)",
                  }}
                >
                  Loading object...
                </div>
              )}

              {/* Object ID Info */}
              {objectId && (
                <div
                  style={{
                    color: "#ffffff",
                    fontSize: "0.85rem",
                    padding: "0.5rem 1rem",
                    borderRadius: "6px",
                    border: "1px solid rgba(102, 102, 102, 0.15)",
                    backgroundColor: "rgba(102, 102, 102, 0.03)",
                    fontFamily: "monospace",
                  }}
                >
                  <span style={{ fontWeight: 400, color: "#666" }}>
                    Object:
                  </span>{" "}
                  {truncateTxId(objectId)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PortfolioView;
