# Load necessary library
# install.packages("pROC")
library(pROC)

# 1. Set Parameters
n_items <- 25      # Sample size (e.g., 25 words or 75 phonemes)
n_sims <- 5000     # Number of virtual patients per group
p_base <- 0.80     # Baseline true performance (80%)
p_decline <- 0.65  # Performance after true decline (65%)

# 2. Simulate the "Stable" Group (Ground Truth = 0)
# Both scores drawn from the same 80% probability
stable_test <- rbinom(n_sims, n_items, p_base)
stable_retest <- rbinom(n_sims, n_items, p_base)

# 3. Simulate the "Decline" Group (Ground Truth = 1)
# Second score is drawn from a lower 65% probability
decline_test <- rbinom(n_sims, n_items, p_base)
decline_retest <- rbinom(n_sims, n_items, p_decline)

# 4. Calculate Binomial Z-Scores for every pair
# Z = (p1 - p2) / sqrt( (p1*(1-p1)/n) + (p2*(1-p2)/n) )
calc_z <- function(s1, s2, n) {
  p1 <- s1/n
  p2 <- s2/n
  # Add small constant to avoid division by zero at 0% or 100%
  se <- sqrt( (p1*(1-p1)/n) + (p2*(1-p2)/n) + 1e-6)
  return((p1 - p2) / se)
}

z_stable <- calc_z(stable_test, stable_retest, n_items)
z_decline <- calc_z(decline_test, decline_retest, n_items)

# 5. Prepare Data for ROC
# Combine results and create a "True State" label
all_z_scores <- c(z_stable, z_decline)
true_labels <- c(rep(0, n_sims), rep(1, n_sims))

# 6. Run ROC Analysis
roc_obj <- roc(true_labels, all_z_scores)

# 7. Output Results
print(roc_obj) # This gives you the AUC (Area Under the Curve)
plot(roc_obj, main="ROC Curve: Binomial CDS Logic", col="blue", lwd=2)
