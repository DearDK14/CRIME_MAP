# CRIMEMAP Machine Learning & Hotspot Analysis Methodology

> **Puducherry Police Hackathon 2026 — Problem Statement 2**  
> *Explainable Spatial Clustering, Risk Scoring & Decision-Support Pipeline*

---

## 1. Algorithmic Overview & Objectives

In law enforcement analytics, machine learning must deliver **actionable**, **reproducible**, and **fully explainable** intelligence. "Black box" neural networks are unsuited for policing decision-making because station commanders and courts require justifiable operational rationale.

The CRIMEMAP machine learning architecture achieves three specific goals:
1. **Spatial Hotspot Identification**: Separating dense geographic crime clusters from diffuse background noise using Haversine Density-Based Spatial Clustering of Applications with Noise (DBSCAN).
2. **Transparent Multi-Factor Risk Scoring**: Quantifying threat level on an interpretable 0–100 scale using five clearly audited operational factors.
3. **Sector Predictive Risk Forecasting**: Estimating short-term incident pressure per sector to guide patrol allocation.

---

## 2. Spatial Clustering: Vectorized Haversine DBSCAN

### Why DBSCAN over K-Means?
Traditional K-Means clustering assumes spherical clusters of equal size and forces every data point into a cluster (generating false hotspots from isolated incidents). In contrast, DBSCAN:
- Discovers arbitrary-shaped spatial clusters matching streets and commercial alleys.
- Does not require pre-specifying cluster counts ($k$).
- Explicitly isolates non-clustered incidents as statistical "noise".

### Haversine Metric on Spherical Earth
Coordinates on Earth cannot be measured using simple Euclidean flat distance ($d = \sqrt{\Delta x^2 + \Delta y^2}$) without significant distortion. CRIMEMAP converts all coordinates $(\phi, \lambda)$ into radians and computes great-circle distance via the Haversine equation:

$$d = 2 R \arcsin \left( \sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos \phi_1 \cos \phi_2 \sin^2\left(\frac{\Delta \lambda}{2}\right)} \right)$$

where $R = 6,371,000 \text{ meters}$.

### Dynamic Hyperparameters
- **$\epsilon$ (Epsilon)**: Spatial neighborhood radius (default: $600 \text{ meters}$, configurable $200\text{m} - 1500\text{m}$).
- **MinPts (Minimum Samples)**: Minimum incident count required to constitute a dense core cluster (default: $5 \text{ points}$).

For every cluster, the engine computes:
- Spatial centroid $(\bar{\phi}, \bar{\lambda})$.
- Minimum bounding radius covering all cluster member incidents.
- Convex Hull polygon for GeoJSON rendering.

---

## 3. The 5-Factor Explainable Risk Scoring Formula

Hotspots are evaluated using a deterministic, 5-factor weighted formula producing an index from $0.0$ to $100.0$:

$$\text{Risk Score} = w_1 \cdot D_{\text{hist}} + w_2 \cdot F_{\text{rec}} + w_3 \cdot S_{\text{sev}} + w_4 \cdot T_{\text{temp}} + w_5 \cdot R_{\text{rep}}$$

### Factor Weights Breakdown

| Factor | Notation | Weight ($w_i$) | Operational Meaning & Calculation |
| :--- | :---: | :---: | :--- |
| **Historical Density** | $D_{\text{hist}}$ | **0.25** | Volume of incidents per unit area within the cluster envelope: $\min\left(100, \frac{N}{\pi r^2} \times 10^6 \times 20\right)$. |
| **Recent Frequency** | $F_{\text{rec}}$ | **0.25** | Proportion of cluster incidents occurring within the last 14 days, highlighting accelerating threats. |
| **Crime Severity** | $S_{\text{sev}}$ | **0.25** | Weighted severity index where High = 3.0, Medium = 2.0, Low = 1.0, normalized against maximum severity. |
| **Temporal Concentration**| $T_{\text{temp}}$ | **0.15** | Degree of clustering during specific 4-hour diurnal windows (e.g. night-time vulnerable hours). |
| **Repeated Proximity** | $R_{\text{rep}}$ | **0.10** | Frequency of recurring incidents within 100 meters of the same coordinate node (recidivism indicator). |

### Categorization Tiers
- **High Risk**: Score $\ge 70.0$ (Triggers tactical surveillance alert and prioritized patrol allocation).
- **Medium Risk**: $40.0 \le \text{Score} < 70.0$ (Scheduled vigilance and beat patrol routing).
- **Low Risk**: $\text{Score} < 40.0$ (Routine monitoring).

---

## 4. Sector Predictive Risk Forecasting & Validation

To evaluate future incident pressure, CRIMEMAP divides territorial jurisdictions into sectors and evaluates expected incidents:

$$\hat{Y}_{z, t+1} = \alpha \cdot \bar{Y}_{z, \text{recent}} + (1 - \alpha) \cdot \bar{Y}_{z, \text{baseline}} + \sum \beta_k X_k$$

### Model Validation Metrics
Model performance is continuously evaluated by comparing against a naive historical baseline:
- **Baseline MAE (Mean Absolute Error)**: $9.022$ incidents.
- **CRIMEMAP Model MAE**: $0.699$ incidents (**92.2% reduction in estimation error**).

---

## 5. Ethical AI & Human-in-the-Loop Safeguards

1. **Mandatory Labeling**: All predictions are explicitly labeled as:
   $$\text{"Risk/Hotspot Assessment"}$$
   The system never presents predictions as guaranteed future criminal events.
2. **Support Human Decision-Making**: Algorithmic outputs inform patrol dispatch schedules and preventative lighting/CCTV placement; they do not trigger automated punitive actions.
3. **No Confidential Real Data in Development**: All demonstration benchmarks utilize realistic, synthetic, anonymized event distributions across Puducherry.
