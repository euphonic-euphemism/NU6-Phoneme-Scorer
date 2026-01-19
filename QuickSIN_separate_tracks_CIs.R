# ==============================================================================
# Monte Carlo Simulation for QuickSIN Critical Differences (Pairwise Method)
# Methodology: Adapted from Carney & Schlauch (2007) / Schlauch & Carney (2018)
# Context: IEEE Sentences (Redundant) -> Effective N approx 13 per 30 words
# ==============================================================================

# --- 1. CONFIGURATION ---
set.seed(2025)           # Ensure reproducibility
n_sims <- 100000         # Number of Monte Carlo trials per score point

# Define Confidence Levels (80% and 95%)
conf_levels <- c(0.80, 0.95)

# Define Scenarios (List length vs. Effective N)
# Ratio is approx 2.3 words per independent unit (30 words / 13 units)
scenarios <- data.frame(
  Label   = c("1_List_30Words", "2_Lists_60Words", "3_Lists_90Words"),
  N_Scale = c(30,               60,                90),
  N_Eff   = c(13,               26,                39)
)

# --- 2. HELPER FUNCTIONS ---

# Function to simulate variance for a single proportion (p) given an Effective N
simulate_variance <- function(n_eff, p, sims) {
  # Handle fractional N_eff (e.g., if we used 12.5) using Mixture Model
  if (n_eff %% 1 != 0) {
    n_floor <- floor(n_eff)
    n_ceil  <- ceiling(n_eff)
    prob_decimal <- n_eff - n_floor

    # Randomly select N for each trial based on the decimal probability
    n_samples <- sample(c(n_floor, n_ceil), size = sims, replace = TRUE,
                        prob = c(1 - prob_decimal, prob_decimal))
  } else {
    n_samples <- rep(n_eff, sims)
  }

  # Generate binomial successes (how many "independent chunks" were heard?)
  # We simulate 'successes' out of n_eff trials
  counts <- rbinom(sims, size = n_samples, prob = p)

  # Convert to proportions (0 to 1)
  proportions <- counts / n_samples

  # Return the variance of these simulated proportions
  return(var(proportions))
}

# Main function to generate table for one scenario
generate_table <- function(scenario_name, n_eff, n_scale, conf_level, n_sims) {

  # Get Z-score for two-tailed test
  z_score <- qnorm(1 - (1 - conf_level) / 2)

  message(paste0("Generating [", scenario_name, "] N_eff=", n_eff,
                 " | Scale=0-", n_scale, " | ", conf_level*100, "% CI"))

  # A. Generate Variance Map
  # We calculate the variance for every integer score on the actual scale (0 to 30, etc.)
  variances <- numeric(n_scale + 1)

  for (i in 0:n_scale) {
    p <- i / n_scale
    variances[i + 1] <- simulate_variance(n_eff, p, n_sims)
  }

  # B. Pairwise Comparison Loop
  results <- data.frame(
    Scenario = character(),
    Confidence = numeric(),
    Score_Raw = integer(),
    Score_Pct = numeric(),
    Lower_Limit_Raw = integer(),
    Upper_Limit_Raw = integer(),
    Lower_Limit_Pct = numeric(),
    Upper_Limit_Pct = numeric()
  )

  for (s1 in 0:n_scale) {
    p1 <- s1 / n_scale
    var1 <- variances[s1 + 1]

    # Find Lower Limit (Iterate downwards from s1)
    lower_limit <- s1
    if (s1 > 0) {
      for (s2 in (s1-1):0) {
        p2 <- s2 / n_scale
        var2 <- variances[s2 + 1]

        # Standard Error of the Difference
        se_diff <- sqrt(var1 + var2)

        # If difference exceeds Critical Value, we found the limit
        if (abs(p1 - p2) > (z_score * se_diff)) {
          break
        }
        lower_limit <- s2 # Update limit if difference is NOT significant
      }
    }

    # Find Upper Limit (Iterate upwards from s1)
    upper_limit <- s1
    if (s1 < n_scale) {
      for (s2 in (s1+1):n_scale) {
        p2 <- s2 / n_scale
        var2 <- variances[s2 + 1]

        se_diff <- sqrt(var1 + var2)

        if (abs(p1 - p2) > (z_score * se_diff)) {
          break
        }
        upper_limit <- s2
      }
    }

    # Append row
    results <- rbind(results, data.frame(
      Scenario = scenario_name,
      Confidence = conf_level,
      Score_Raw = s1,
      Score_Pct = round(p1 * 100, 1),
      Lower_Limit_Raw = lower_limit,
      Upper_Limit_Raw = upper_limit,
      Lower_Limit_Pct = round((lower_limit / n_scale) * 100, 1),
      Upper_Limit_Pct = round((upper_limit / n_scale) * 100, 1)
    ))
  }

  return(results)
}

# --- 3. EXECUTION ---

final_output <- data.frame()

for (i in 1:nrow(scenarios)) {
  current <- scenarios[i,]

  for (conf in conf_levels) {
    tbl <- generate_table(current$Label, current$N_Eff, current$N_Scale, conf, n_sims)
    final_output <- rbind(final_output, tbl)
  }
}

# --- 4. EXPORT ---

# Clean column names
colnames(final_output) <- c("List_Config", "Confidence", "Score_Raw", "Score_Percent",
                            "Lower_Limit_Raw", "Upper_Limit_Raw",
                            "Lower_Limit_Percent", "Upper_Limit_Percent")

# Save to CSV
write.csv(final_output, "QuickSIN_Critical_Differences_Pairwise.csv", row.names = FALSE)

message("\nSUCCESS: 'QuickSIN_Critical_Differences_Pairwise.csv' created.")
message("Preview of 30-word list (95% CI):")
print(head(subset(final_output, List_Config == "1_List_30Words" & Confidence == 0.95)))
