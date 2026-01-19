# ==============================================================================
# Monte Carlo Simulation for Word Recognition Critical Differences (Pairwise)
# Reproducing Schlauch & Carney (2018) Methodology
# ==============================================================================

# --- 1. USER SETTINGS ---
n_total     <- 150       # Total possible score (e.g., 150 phonemes)
n_eff       <- 125       # Effective N (e.g., 125 for phoneme scoring)
conf_level  <- 0.80      # Confidence Level (use 0.80 or 0.95)
n_sims      <- 100000    # Number of Monte Carlo trials
set.seed(2025)           # Fixed seed for 100% reproducibility

# Define Z-score based on confidence level
z <- if(conf_level == 0.95) 1.96 else qnorm(1 - (1 - conf_level)/2)

message(paste("Running simulation for N_eff:", n_eff, "| Confidence:", conf_level * 100, "%"))

# --- 2. GENERATE VARIANCE MAP ---
# We calculate the variance of the proportion for every possible raw score
variances <- sapply(0:n_total, function(score) {
  p <- score / n_total

  # Handle fractional N_eff by mixing floor and ceil samples
  if (n_eff %% 1 != 0) {
    n_floor <- floor(n_eff)
    n_ceil  <- ceil(n_eff)
    p_ceil  <- n_eff - n_floor
    n_samples <- sample(c(n_floor, n_ceil), size = n_sims, replace = TRUE, prob = c(1-p_ceil, p_ceil))
  } else {
    n_samples <- n_eff
  }

  sim_proportions <- rbinom(n_sims, size = n_samples, prob = p) / n_samples
  return(var(sim_proportions))
})

# --- 3. PAIRWISE COMPARISON LOGIC ---
# Iterate through every score to find the upper and lower limits
results <- data.frame(Score_Raw = 0:n_total)

limits <- t(sapply(0:n_total, function(s1) {
  p1 <- s1 / n_total
  var1 <- variances[s1 + 1]

  # Find Lower Limit
  lower_limit <- s1
  if (s1 > 0) {
    for (s2 in (s1-1):0) {
      p2 <- s2 / n_total
      var2 <- variances[s2 + 1]
      std_diff <- sqrt(var1 + var2)
      if (abs(p1 - p2) > (z * std_diff)) break
      lower_limit <- s2
    }
  }

  # Find Upper Limit
  upper_limit <- s1
  if (s1 < n_total) {
    for (s2 in (s1+1):n_total) {
      p2 <- s2 / n_total
      var2 <- variances[s2 + 1]
      std_diff <- sqrt(var1 + var2)
      if (abs(p1 - p2) > (z * std_diff)) break
      upper_limit <- s2
    }
  }

  return(c(lower_limit, upper_limit))
}))

# --- 4. FORMAT FINAL TABLE ---
results$Lower_Limit_Pct <- round((limits[,1] / n_total) * 100, 1)
results$Upper_Limit_Pct <- round((limits[,2] / n_total) * 100, 1)
results$Score_Pct       <- round((results$Score_Raw / n_total) * 100, 1)

# Display the first few rows
head(results, 10)

# Export to CSV
write.csv(results, "Pairwise_Critical_Differences_R_Output.csv", row.names = FALSE)
message("Simulation complete. Table saved to working directory.")
