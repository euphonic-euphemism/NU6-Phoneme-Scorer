# Load necessary libraries
if (!require("pROC")) install.packages("pROC")
library(pROC)

# 1. Set Simulation Parameters
n_sims <- 10000    # High number of iterations for curve stability
p_base <- 0.80     # Baseline true performance (80%)
p_decline <- 0.65  # 15% true clinical decline (65%)

# Define raw sample sizes
n_short <- 10
n_std   <- 25
n_phon_raw <- 75

# Define effective sample size (nEff) for phonemes
# Using a j-factor of 1.2 (75 / 1.2 = 62.5)
j_factor <- 1.2
n_phon_eff <- n_phon_raw / j_factor

# 2. Updated Z-Score Function with nEff Support
# s1/s2 = raw counts, n_raw = total items, n_eff = adjusted for independence
calc_z_eff <- function(s1, s2, n_raw, n_eff) {
  p1 <- s1/n_raw
  p2 <- s2/n_raw

  # The Standard Error (SE) uses n_eff to reflect true variance
  se <- sqrt( (p1*(1-p1)/n_eff) + (p2*(1-p2)/n_eff) + 1e-6)

  return((p1 - p2) / se)
}

# 3. Helper Function to Generate ROC Data
# For whole words, n_raw and n_eff are identical (j=1.0)
get_roc_data_eff <- function(n_raw, n_eff, n_sims, p_base, p_decline) {
  # Stable Group (Ground Truth = 0)
  s_test <- rbinom(n_sims, n_raw, p_base)
  s_retest <- rbinom(n_sims, n_raw, p_base)
  z_stable <- calc_z_eff(s_test, s_retest, n_raw, n_eff)

  # Decline Group (Ground Truth = 1)
  d_test <- rbinom(n_sims, n_raw, p_base)
  d_retest <- rbinom(n_sims, n_raw, p_decline)
  z_decline <- calc_z_eff(d_test, d_retest, n_raw, n_eff)

  # Combine results and create labels
  scores <- c(z_stable, z_decline)
  labels <- c(rep(0, n_sims), rep(1, n_sims))

  return(roc(labels, scores, quiet = TRUE))
}

# 4. Execute Simulations
# For n=10 and n=25, n_raw and n_eff are the same
roc_short <- get_roc_data_eff(n_short, n_short, n_sims, p_base, p_decline)
roc_std   <- get_roc_data_eff(n_std,   n_std,   n_sims, p_base, p_decline)

# For phonemes, we use the adjusted n_eff (62.5)
roc_phon  <- get_roc_data_eff(n_phon_raw, n_phon_eff, n_sims, p_base, p_decline)

# 5. Print AUC Results to Console
cat("--- Comparative Diagnostic Accuracy (AUC) ---\n")
cat("Short Word List (n=10): ", round(auc(roc_short), 4), "\n")
cat("Standard Word List (n=25): ", round(auc(roc_std), 4), "\n")
cat("Phonemic Scoring (nEff=62.5): ", round(auc(roc_phon), 4), "\n")

# 6. Generate Comparative Visualization
plot(roc_phon, col="darkblue", lwd=3,
     main="CDS Performance: Word vs. Phonemic (nEff Adjusted)",
     xlab="1 - Specificity (False Alarm Rate)",
     ylab="Sensitivity (True Positive Rate)")

plot(roc_std, col="darkgreen", lwd=3, add=TRUE)
plot(roc_short, col="darkred", lwd=3, add=TRUE)

# Reference Line (Chance)
abline(a=0, b=1, lty=2, col="grey")

# Dynamic Legend with AUC values
legend("bottomright",
       legend=c(paste("Phonemes (nEff=62.5), AUC:", round(auc(roc_phon), 3)),
                paste("Standard Words (n=25), AUC:", round(auc(roc_std), 3)),
                paste("Short Words (n=10), AUC:", round(auc(roc_short), 3))),
       col=c("darkblue", "darkgreen", "darkred"),
       lwd=3, cex=0.8, bty="n")
