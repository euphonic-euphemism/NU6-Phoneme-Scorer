# ==============================================================================
# Monte Carlo Simulation for Word Recognition Critical Differences
# Methodology: Pairwise Comparison (Carney & Schlauch, 2007)
# ==============================================================================

# --- 1. CONFIGURATION ---
set.seed(2025)           # Ensure reproducibility
n_sims <- 100000         # Number of Monte Carlo trials

# Define the Confidence Levels
# 80% -> Z ~ 1.28
# 95% -> Z ~ 1.96 (Note: Change to 2.0 manually if you want to match the 2018 paper exactly)
conf_levels <- c(0.80, 0.95)

# Define the Scenarios (Effective N vs. Score Scale)
# This allows us to run N_eff=25 twice with different scales.
scenarios <- data.frame(
  Label   = c("WW_10", "WW_25", "Phoneme_10", "WW_50", "Phoneme_25", "Phoneme_50"),
  N_Eff   = c(10,      25,      25,           50,      62.5,         125),
  N_Scale = c(10,      25,      30,           50,      75,           150)
)

# --- 2. HELPER FUNCTIONS ---

# Function to get Z-score for a given confidence level (two-tailed)
get_z_score <- function(conf_level) {
  return(qnorm(1 - (1 - conf_level) / 2))
}

# Function to simulate variance for a single proportion
simulate_variance <- function(n_eff, p, sims) {
  # Handle fractional N (e.g., 62.5) using Mixture Model
  if (n_eff %% 1 != 0) {
    n_floor <- floor(n_eff)
    n_ceil  <- ceiling(n_eff)
    prob_decimal <- n_eff - n_floor

    # Randomly select N for each trial based on the decimal probability
    n_samples <- sample(c(n_floor, n_ceil), size = sims, replace = TRUE,
                        prob = c(1 - prob_decimal, prob_decimal))
  } else {
    n_samples <- n_eff
  }

  # Generate binomial variates (counts of successes)
  counts <- rbinom(sims, size = n_samples, prob = p)

  # Convert to proportions
  proportions <- counts / n_samples

  # Return the variance of these simulated proportions
  return(var(proportions))
}

# Main function to generate a table for a specific Scenario
generate_table <- function(scenario_name, n_eff, n_scale, conf_level, n_sims) {

  z_score <- get_z_score(conf_level)
  # Uncomment the line below to FORCE the Z-score to 2.0 (matching 2018 paper)
  # z_score <- 2.0

  message(paste0("Generating [", scenario_name, "] N_eff=", n_eff,
                 " Scale=0-", n_scale, " | ", conf_level*100, "% CI"))

  # 1. Generate Variance Map for every possible score on the scale
  # We loop 0 to n_scale to get variance for every integer score
  variances <- numeric(n_scale + 1)

  for (i in 0:n_scale) {
    p <- i / n_scale
    variances[i + 1] <- simulate_variance(n_eff, p, n_sims)
  }

  # 2. Perform Pairwise Hypothesis Testing to find Limits
  results <- data.frame(
    Scenario = character(),
    N_Eff = numeric(),
    N_Scale = numeric(),
    Confidence = numeric(),
    Score_Raw = integer(),
    Score_Pct = numeric(),
    Lower_Limit_Pct = numeric(),
    Upper_Limit_Pct = numeric()
  )

  for (s1 in 0:n_scale) {
    p1 <- s1 / n_scale
    var1 <- variances[s1 + 1]

    # Find Lower Limit (iterate downwards)
    lower_limit <- s1
    if (s1 > 0) {
      for (s2 in (s1-1):0) {
        p2 <- s2 / n_scale
        var2 <- variances[s2 + 1]

        # Standard Deviation of the Difference
        sd_diff <- sqrt(var1 + var2)

        # Critical Difference Check
        if (abs(p1 - p2) > (z_score * sd_diff)) {
          break # Significant difference found, stop.
        }
        lower_limit <- s2
      }
    }

    # Find Upper Limit (iterate upwards)
    upper_limit <- s1
    if (s1 < n_scale) {
      for (s2 in (s1+1):n_scale) {
        p2 <- s2 / n_scale
        var2 <- variances[s2 + 1]

        sd_diff <- sqrt(var1 + var2)

        if (abs(p1 - p2) > (z_score * sd_diff)) {
          break
        }
        upper_limit <- s2
      }
    }

    # Store Row
    results <- rbind(results, data.frame(
      Scenario = scenario_name,
      N_Eff = n_eff,
      N_Scale = n_scale,
      Confidence = conf_level,
      Score_Raw = s1,
      Score_Pct = round(p1 * 100, 1),
      Lower_Limit_Pct = round((lower_limit / n_scale) * 100, 1),
      Upper_Limit_Pct = round((upper_limit / n_scale) * 100, 1)
    ))
  }

  return(results)
}

# --- 3. EXECUTION LOOP ---

all_tables <- data.frame()

# Iterate through each row in the scenarios table
for (i in 1:nrow(scenarios)) {
  current_scen <- scenarios[i,]

  for (conf in conf_levels) {
    # Generate the table
    tbl <- generate_table(current_scen$Label, current_scen$N_Eff, current_scen$N_Scale, conf, n_sims)

    # Append to master list
    all_tables <- rbind(all_tables, tbl)
  }
}

# --- 4. EXPORT ---

# Format column names for clarity
colnames(all_tables) <- c("Scenario", "N_Effective", "Score_Scale_Max", "Confidence_Level",
                          "Raw_Score", "Score_Percent", "Lower_Limit_Percent", "Upper_Limit_Percent")

# Write to CSV in the working directory
write.csv(all_tables, "Word_Recognition_Critical_Differences_Simulated_v2.csv", row.names = FALSE)

# Print a preview to console
print("Simulation Complete. Preview of 'Phoneme_10' (N_eff=25, Scale=30):")
print(head(subset(all_tables, Scenario == "Phoneme_10"), 10))

message("File 'Word_Recognition_Critical_Differences_Simulated_v2.csv' has been saved.")
