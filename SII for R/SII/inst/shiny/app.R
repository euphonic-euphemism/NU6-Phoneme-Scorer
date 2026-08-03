library(shiny)
library(bslib)
library(SII)

# Force source the local package files to ensure the latest code is used (overriding the installed package)
tryCatch({
  source("../../R/sii.R")
  source("../../R/nalr.R")
  source("../../R/plot.SII.R")
  source("../../R/benchmark_targets.R")
}, error = function(e) print(paste("Error sourcing local paths:", e$message)))

# Define the Modern UI Layout
ui <- page_sidebar(
  title = "SII Advanced Interactive Dashboard",
  theme = bs_theme(version = 5, bootswatch = "flatly", primary = "#2c3e50"),
  fillable = FALSE,
  
  sidebar = sidebar(
    width = 300,
    accordion(
      open = c("Audiogram Thresholds (dB HL)", "Configuration"),
      accordion_panel(
        "Audiogram Thresholds (dB HL)",
        selectInput("preset", "Load Preset Audiogram:", 
                    choices = c("Custom" = "custom", 
                                "A-1 (Mild-to-Moderate Sloping)" = "a1", 
                                "A-2 (Reverse Slope)" = "a2", 
                                "A-3 (Moderately Sloping)" = "a3", 
                                "A-4 (Steep Sloping)" = "a4",
                                "A-5 (Severe Steep Sloping)" = "a5",
                                "A-6 (Mixed)" = "a6",
                                "A-7 (Conductive)" = "a7"),
                    selected = "custom"),
        sliderInput("htl250", "250 Hz", min = 0, max = 120, value = 20, step = 5),
        sliderInput("htl500", "500 Hz", min = 0, max = 120, value = 30, step = 5),
        sliderInput("htl1000", "1000 Hz", min = 0, max = 120, value = 45, step = 5),
        sliderInput("htl2000", "2000 Hz", min = 0, max = 120, value = 60, step = 5),
        sliderInput("htl4000", "4000 Hz", min = 0, max = 120, value = 75, step = 5),
        sliderInput("htl8000", "8000 Hz", min = 0, max = 120, value = 80, step = 5),
        checkboxGroupInput("nr_air", "No Response (Air):", 
                           choices = c("250", "500", "1000", "2000", "4000", "8000"), 
                           inline = TRUE)
      ),
      accordion_panel(
        "Bone Conduction (dB HL)",
        checkboxInput("use_bc", "Include Bone Conduction (Air-Bone Gap)?", value = FALSE),
        conditionalPanel(
          condition = "input.use_bc == true",
          sliderInput("bc250", "250 Hz", min = -10, max = 55, value = 20, step = 5),
          sliderInput("bc500", "500 Hz", min = -10, max = 75, value = 30, step = 5),
          sliderInput("bc1000", "1000 Hz", min = -10, max = 80, value = 45, step = 5),
          sliderInput("bc2000", "2000 Hz", min = -10, max = 80, value = 60, step = 5),
          sliderInput("bc4000", "4000 Hz", min = -10, max = 80, value = 75, step = 5),
          checkboxGroupInput("nr_bone", "No Response (Bone):", 
                             choices = c("250", "500", "1000", "2000", "4000"), 
                             inline = TRUE)
        )
      ),
      accordion_panel(
        "Loudness Discomfort (dB HL)",
        checkboxInput("use_ldl", "Use Measured LDLs?", value = FALSE),
        conditionalPanel(
          condition = "input.use_ldl == true",
          sliderInput("ldl250", "250 Hz", min = 60, max = 130, value = 100, step = 5),
          sliderInput("ldl500", "500 Hz", min = 60, max = 130, value = 100, step = 5),
          sliderInput("ldl1000", "1000 Hz", min = 60, max = 130, value = 100, step = 5),
          sliderInput("ldl2000", "2000 Hz", min = 60, max = 130, value = 100, step = 5),
          sliderInput("ldl4000", "4000 Hz", min = 60, max = 130, value = 100, step = 5),
          sliderInput("ldl8000", "8000 Hz", min = 60, max = 130, value = 100, step = 5)
        )
      ),
      accordion_panel(
        "Configuration",
        radioButtons("speech_level", "Speech Input Level (SPLogram):", 
                     choices = c("50 dB SPL (Soft)" = "50", "65 dB SPL (Average)" = "65", "80 dB SPL (Loud)" = "80"),
                     selected = "65"),
        selectInput("prescription", "Fitting Rationale:", 
                    choices = c("Unaided" = "none", "NAL-R" = "NAL-R", "Open-NL" = "Open-NL"),
                    selected = "Open-NL"),
        selectInput("module", "Operating Module:",
                    choices = c("Standard (Everyday)" = "standard", 
                                "Comfort in Noise (CIN)" = "cin", 
                                "Minimal Hearing Loss (MHL)" = "mhl"),
                    selected = "standard"),
        checkboxInput("desensitization", "Apply Desensitization (Johnson 2013)", value = FALSE)
      ),
      accordion_panel(
        "Demographics & Fitting",
        selectInput("gender", "Gender:", choices = c("Male" = "male", "Female" = "female"), selected = "male"),
        selectInput("age", "Age Group:", 
                    choices = c("Adult (>5 years)" = "adult", 
                                "Child: 36-59 months" = "child_36_59",
                                "Child: 24-35 months" = "child_24_35",
                                "Child: 12-23 months" = "child_12_23",
                                "Child: 6-11 months" = "child_6_11",
                                "Child: 0-5 months" = "child_0_5"), 
                    selected = "adult"),
        conditionalPanel(
          condition = "input.age == 'adult'",
          numericInput("adult_age", "Adult Age (Years):", value = 65, min = 18, max = 110, step = 1)
        ),
        selectInput("experience", "Experience:", 
                    choices = c("Power User" = "power", "Experienced User" = "experienced", "New User" = "new"), 
                    selected = "experienced"),
        selectInput("config", "Fitting Configuration:", choices = c("Bilateral (Both Ears)" = "bilateral", "Unilateral (One Ear)" = "unilateral"), selected = "bilateral"),

        selectInput("coupling", "Acoustic Coupling / Vent:", 
                    choices = list(
                      "Solid Earmolds" = c("Unvented Earmold (Custom Occluded)" = "custom_occluded",
                                           "1 mm Solid Vent (Pressure)" = "vent_1mm_solid",
                                           "2 mm Solid Vent (Moderate)" = "vent_2mm_solid",
                                           "3 mm Solid Vent (Large)" = "vent_3mm_solid"),
                      "Hollow Earmolds (Short Vent)" = c("1 mm Hollow Vent (Pressure)" = "vent_1mm_hollow",
                                                         "2 mm Hollow Vent (Moderate)" = "vent_2mm_hollow",
                                                         "3 mm Hollow Vent (Large)" = "vent_3mm_hollow"),
                      "Generic Domes" = c("Double Dome" = "double_dome",
                                          "Tulip Dome" = "tulip_dome",
                                          "Open Dome" = "open_dome")
                    ), 
                    selected = "custom_occluded"),
        selectInput("transducer", "Audiometric Transducer:", 
                    choices = c("Insert Earphones (ER-3A)" = "inserts", 
                                "Supra-aural Headphones (TDH-39)" = "supra_aural"),
                    selected = "inserts")
      ),
      accordion_panel(
        "Advanced Parameters",
        tags$div(class = "mt-3"),
        tags$strong("Word Recognition & Distortion"),
        tags$i(class = "fa fa-info-circle text-muted", title = "Distortion penalties (HF roll-off & soft-compression) are only applied for Adults. Pediatric targets prioritize maximum audibility.", "data-toggle" = "tooltip", style = "margin-left: 5px; cursor: help;"),
        tooltip(
          numericInput("measured_wrs", "Measured Word Rec (%):", value = NA, min = 0, max = 100),
          "The patient's clinical NU-6 score. Used to categorize cochlear distortion (Margolis et al., 2025)."
        ),
        tooltip(
          numericInput("wrs_level", "Word Rec Level (dB SPL):", value = 80, min = 0, max = 120),
          "The presentation level of the clinical word recognition test."
        )
      )
    )
  ),
  
  layout_columns(
    col_widths = c(12),
    card(
      full_screen = TRUE,
      card_header("Clinical SPLogram"),
      plotOutput("splogram", height = "600px")
    ),
    card(
      full_screen = TRUE,
      card_header("Insertion Gain / Plot"),
      plotOutput("gain_plot", height = "600px"),
      accordion(
        open = FALSE,
        accordion_panel(
          "Insertion Gain Targets (dB)",
          tableOutput("ig_table"),
          br(),
          downloadButton("download_gains", "Export Gains (CSV)")
        )
      )
    ),
    card(
      full_screen = TRUE,
      card_header("Dynamic Compression Prescription"),
      uiOutput("compression_prescription")
    ),
    card(
      full_screen = TRUE,
      card_header("Prescription Benchmark Comparison"),
      tableOutput("comparison_table")
    )
  )
)

# Define the Application Logic
server <- function(input, output, session) {
  
  # Static standard data setup
  setup_data <- reactive({
    data("critical", package="SII")
    f_21 <- critical$fi
    # The ANSI S3.5 normal overall SPL is 62.35 dB SPL. Summing spectrum levels directly without 
    # bandwidth scaling yields incorrect levels, resulting in massive over-amplification!
    overall_normal <- 62.35
    list(f_21 = f_21, normal_spectrum = critical$normal, overall_normal = overall_normal)
  })
  
  # Handle Presets
  observeEvent(input$preset, {
    if (input$preset == "a1") {
      updateCheckboxInput(session, "use_bc", value = FALSE)
      updateSliderInput(session, "htl250", value = 15)
      updateSliderInput(session, "htl500", value = 20)
      updateSliderInput(session, "htl1000", value = 30)
      updateSliderInput(session, "htl2000", value = 40)
      updateSliderInput(session, "htl4000", value = 50)
      updateSliderInput(session, "htl8000", value = 60)
    } else if (input$preset == "a2") {
      updateCheckboxInput(session, "use_bc", value = FALSE)
      updateSliderInput(session, "htl250", value = 60)
      updateSliderInput(session, "htl500", value = 50)
      updateSliderInput(session, "htl1000", value = 40)
      updateSliderInput(session, "htl2000", value = 30)
      updateSliderInput(session, "htl4000", value = 20)
      updateSliderInput(session, "htl8000", value = 15)
    } else if (input$preset == "a3") {
      updateCheckboxInput(session, "use_bc", value = FALSE)
      updateSliderInput(session, "htl250", value = 10)
      updateSliderInput(session, "htl500", value = 20)
      updateSliderInput(session, "htl1000", value = 40)
      updateSliderInput(session, "htl2000", value = 50)
      updateSliderInput(session, "htl4000", value = 55)
      updateSliderInput(session, "htl8000", value = 60)
    } else if (input$preset == "a4") {
      updateCheckboxInput(session, "use_bc", value = FALSE)
      updateSliderInput(session, "htl250", value = 0)
      updateSliderInput(session, "htl500", value = 0)
      updateSliderInput(session, "htl1000", value = 10)
      updateSliderInput(session, "htl2000", value = 40)
      updateSliderInput(session, "htl4000", value = 70)
      updateSliderInput(session, "htl8000", value = 80)
    } else if (input$preset == "a5") {
      updateCheckboxInput(session, "use_bc", value = FALSE)
      updateSliderInput(session, "htl250", value = 10)
      updateSliderInput(session, "htl500", value = 10)
      updateSliderInput(session, "htl1000", value = 20)
      updateSliderInput(session, "htl2000", value = 60)
      updateSliderInput(session, "htl4000", value = 80)
      updateSliderInput(session, "htl8000", value = 100)
    } else if (input$preset == "a6") {
      updateCheckboxInput(session, "use_bc", value = TRUE)
      updateSliderInput(session, "htl250", value = 50)
      updateSliderInput(session, "htl500", value = 55)
      updateSliderInput(session, "htl1000", value = 60)
      updateSliderInput(session, "htl2000", value = 65)
      updateSliderInput(session, "htl4000", value = 75)
      updateSliderInput(session, "htl8000", value = 80)
      updateSliderInput(session, "bc250", value = 20)
      updateSliderInput(session, "bc500", value = 25)
      updateSliderInput(session, "bc1000", value = 30)
      updateSliderInput(session, "bc2000", value = 35)
      updateSliderInput(session, "bc4000", value = 45)
    } else if (input$preset == "a7") {
      updateCheckboxInput(session, "use_bc", value = TRUE)
      updateSliderInput(session, "htl250", value = 50)
      updateSliderInput(session, "htl500", value = 50)
      updateSliderInput(session, "htl1000", value = 50)
      updateSliderInput(session, "htl2000", value = 50)
      updateSliderInput(session, "htl4000", value = 50)
      updateSliderInput(session, "htl8000", value = 50)
      updateSliderInput(session, "bc250", value = 0)
      updateSliderInput(session, "bc500", value = 0)
      updateSliderInput(session, "bc1000", value = 0)
      updateSliderInput(session, "bc2000", value = 0)
      updateSliderInput(session, "bc4000", value = 0)
    } else if (input$preset == "custom") {
      updateCheckboxInput(session, "use_bc", value = FALSE)
      updateSliderInput(session, "htl250", value = 20)
      updateSliderInput(session, "htl500", value = 30)
      updateSliderInput(session, "htl1000", value = 45)
      updateSliderInput(session, "htl2000", value = 60)
      updateSliderInput(session, "htl4000", value = 75)
      updateSliderInput(session, "htl8000", value = 80)
    }
  })
  
  # Ensure BC <= AC (Air-Bone Gap cannot be negative)
  observe({
    req(input$use_bc)
    if (input$bc250 > input$htl250) updateSliderInput(session, "bc250", value = input$htl250)
    if (input$bc500 > input$htl500) updateSliderInput(session, "bc500", value = input$htl500)
    if (input$bc1000 > input$htl1000) updateSliderInput(session, "bc1000", value = input$htl1000)
    if (input$bc2000 > input$htl2000) updateSliderInput(session, "bc2000", value = input$htl2000)
    if (input$bc4000 > input$htl4000) updateSliderInput(session, "bc4000", value = input$htl4000)
  })
  
  # Reactive SII Calculation triggers every time a slider is moved
  sii_obj <- reactive({
    req(input$htl250)
    d <- setup_data()
    
    # 1. Grab thresholds from sliders
    f_htl <- c(250, 500, 1000, 2000, 4000, 8000)
    threshold <- c(input$htl250, input$htl500, input$htl1000, 
                   input$htl2000, input$htl4000, input$htl8000)
                   
    # Apply NR overrides for Air
    nr_a <- input$nr_air
    if (!is.null(nr_a)) {
      if ("250" %in% nr_a) threshold[1] <- 120
      if ("500" %in% nr_a) threshold[2] <- 120
      if ("1000" %in% nr_a) threshold[3] <- 120
      if ("2000" %in% nr_a) threshold[4] <- 120
      if ("4000" %in% nr_a) threshold[5] <- 120
      if ("8000" %in% nr_a) threshold[6] <- 120
    }
    
    # 2. Interpolate to 21 critical bands
    htl_21 <- approx(x = log10(f_htl), y = threshold, xout = log10(d$f_21), rule = 2)$y
    
    # 3. Handle prescription
    presc <- if (input$prescription == "none") NULL else input$prescription
    
    # 3.5 Handle LDLs
    if (isTRUE(input$use_ldl)) {
      ldl_input <- c(input$ldl250, input$ldl500, input$ldl1000, 
                     input$ldl2000, input$ldl4000, input$ldl8000)
      ldl_21 <- approx(x = log10(f_htl), y = ldl_input, xout = log10(d$f_21), rule = 2)$y
    } else {
      ldl_21 <- NULL
    }
    
    # 3.8 Calculate specific speech spectrum based on user input
    target_level <- as.numeric(input$speech_level)
    speech_input <- d$normal_spectrum + (target_level - d$overall_normal)
    
    # 3.9 Handle Bone Conduction / Air-Bone Gap
    if (isTRUE(input$use_bc)) {
      bc_f <- c(250, 500, 1000, 2000, 4000)
      bc_input <- c(input$bc250, input$bc500, input$bc1000, 
                    input$bc2000, input$bc4000)
                    
      ac_at_bc_f <- threshold[1:5]
      
      # Apply NR overrides for Bone: set to Air threshold to force 0 ABG
      nr_b <- input$nr_bone
      if (!is.null(nr_b)) {
        if ("250" %in% nr_b) bc_input[1] <- ac_at_bc_f[1]
        if ("500" %in% nr_b) bc_input[2] <- ac_at_bc_f[2]
        if ("1000" %in% nr_b) bc_input[3] <- ac_at_bc_f[3]
        if ("2000" %in% nr_b) bc_input[4] <- ac_at_bc_f[4]
        if ("4000" %in% nr_b) bc_input[5] <- ac_at_bc_f[5]
      }
      
      bc_input <- pmin(bc_input, ac_at_bc_f) # Enforce BC <= AC mathematically
      bc_21 <- approx(x = log10(bc_f), y = bc_input, xout = log10(d$f_21), rule = 2)$y
      loss_21 <- pmax(0, htl_21 - bc_21)
    } else {
      loss_21 <- rep(0, length(htl_21))
    }
    
    meas_wrs <- input$measured_wrs
    if (!is.null(meas_wrs) && is.na(meas_wrs)) meas_wrs <- NULL
    
    # 4. Run the robust SII calculation engine
    obj <- sii(speech = speech_input, 
        threshold = htl_21, 
        freq = d$f_21, 
        loss = loss_21,
        prescription = presc, 
        desensitization = input$desensitization,
        ldl = ldl_21,
        gender = input$gender,
        experience = input$experience,
        config = input$config,
        age = input$age,
        age_years = input$adult_age,
        coupling = input$coupling,
        module = input$module,
        transducer = input$transducer,
        measured_wrs = meas_wrs,
        wrs_level = input$wrs_level)
        
    # Append JD2011 targets for plotting if a preset is selected
    preset <- input$preset
    target_level <- as.numeric(input$speech_level)
    if (preset %in% c("a1", "a2", "a3", "a4", "a5", "a6", "a7") && !is.null(presc) && presc == "Open-NL") {
      obj$target_nalnl2 <- get_jd2011_target(preset, "NAL-NL2", d$f_21, target_level)
      obj$target_dsl <- get_jd2011_target(preset, "DSL", d$f_21, target_level)
      obj$target_cameq2 <- get_jd2011_target(preset, "CAMEQ2-HF", d$f_21, target_level)
    }
    
    obj$target_level <- target_level
    
    return(obj)
  })
  
  # Render the SPLogram Plot
  output$splogram <- renderPlot({
    obj <- sii_obj()
    # The clinical=TRUE flag builds the complex clinical SPLogram graph
    plot(obj, clinical = TRUE)
  })
  
  # Render the Insertion Gain Plot
  output$gain_plot <- renderPlot({
    obj <- sii_obj()
    # The clinical=FALSE flag automatically intercepts aided objects to draw 
    # the 3-line Insertion Gain compression curves for 55, 65, and 75 dB SPL!
    plot(obj, clinical = FALSE)
  })
  
  output$ig_table <- renderTable({
    obj <- sii_obj()
    df <- export_gains(obj)
    
    if (is.null(obj$prescription)) {
      return(data.frame("Message" = "No prescription selected. Select Open-NL or NAL-R to view targets."))
    }
    
    # Interpolate to standard octave frequencies for UI
    octaves <- c(250, 500, 1000, 2000, 4000, 8000)
    
    df_oct <- data.frame(
      Frequency = octaves,
      `Soft (50 dB)` = approx(x = log10(df$Frequency), y = df$Gain_50, xout = log10(octaves), rule = 2)$y,
      `Avg (65 dB)` = approx(x = log10(df$Frequency), y = df$Gain_65, xout = log10(octaves), rule = 2)$y,
      `Loud (80 dB)` = approx(x = log10(df$Frequency), y = df$Gain_80, xout = log10(octaves), rule = 2)$y,
      `MPO` = approx(x = log10(df$Frequency), y = df$MPO, xout = log10(octaves), rule = 2)$y,
      check.names = FALSE
    )
    
    # Transpose for horizontal display
    df_t <- as.data.frame(t(df_oct))
    colnames(df_t) <- df_t[1, ]
    df_t <- df_t[-1, ]
    df_t$Metric <- rownames(df_t)
    df_t <- df_t[, c("Metric", as.character(octaves))]
    
    return(df_t)
  }, digits = 1)
  
  output$download_gains <- downloadHandler(
    filename = function() {
      paste("sii_insertion_gains_", Sys.Date(), ".csv", sep = "")
    },
    content = function(file) {
      obj <- sii_obj()
      df <- export_gains(obj)
      write.csv(df, file, row.names = FALSE)
    }
  )
  # Render the Benchmark Comparison Table
  output$comparison_table <- renderTable({
    req(input$htl250)
    d <- setup_data()
    f_htl <- c(250, 500, 1000, 2000, 4000, 8000)
    threshold <- c(input$htl250, input$htl500, input$htl1000, 
                   input$htl2000, input$htl4000, input$htl8000)
                   
    # Apply NR overrides for Air
    nr_a <- input$nr_air
    if (!is.null(nr_a)) {
      if ("250" %in% nr_a) threshold[1] <- 120
      if ("500" %in% nr_a) threshold[2] <- 120
      if ("1000" %in% nr_a) threshold[3] <- 120
      if ("2000" %in% nr_a) threshold[4] <- 120
      if ("4000" %in% nr_a) threshold[5] <- 120
      if ("8000" %in% nr_a) threshold[6] <- 120
    }
    htl_21 <- approx(x = log10(f_htl), y = threshold, xout = log10(d$f_21), rule = 2)$y
    
    # Calculate Speech Input at selected level
    target_level <- as.numeric(input$speech_level)
    speech_input <- d$normal_spectrum + (target_level - d$overall_normal)
    
    # Calculate Bone Conduction / Air-Bone Gap
    if (isTRUE(input$use_bc)) {
      bc_f <- c(250, 500, 1000, 2000, 4000)
      bc_input <- c(input$bc250, input$bc500, input$bc1000, 
                    input$bc2000, input$bc4000)
                    
      ac_at_bc_f <- threshold[1:5]
      
      # Apply NR overrides for Bone: set to Air threshold to force 0 ABG
      nr_b <- input$nr_bone
      if (!is.null(nr_b)) {
        if ("250" %in% nr_b) bc_input[1] <- ac_at_bc_f[1]
        if ("500" %in% nr_b) bc_input[2] <- ac_at_bc_f[2]
        if ("1000" %in% nr_b) bc_input[3] <- ac_at_bc_f[3]
        if ("2000" %in% nr_b) bc_input[4] <- ac_at_bc_f[4]
        if ("4000" %in% nr_b) bc_input[5] <- ac_at_bc_f[5]
      }
      
      bc_input <- pmin(bc_input, ac_at_bc_f)
      bc_21 <- approx(x = log10(bc_f), y = bc_input, xout = log10(d$f_21), rule = 2)$y
      loss_21 <- pmax(0, htl_21 - bc_21)
    } else {
      loss_21 <- rep(0, length(htl_21))
    }
    
    # Calculate Unaided
    obj_unaided <- sii(speech = speech_input, threshold = htl_21, loss = loss_21, freq = d$f_21, prescription = NULL, 
                       desensitization = input$desensitization, transducer = input$transducer)
    
    # Calculate NAL-R
    obj_nalr <- sii(speech = speech_input, threshold = htl_21, loss = loss_21, freq = d$f_21, prescription = "NAL-R", 
                    desensitization = input$desensitization, transducer = input$transducer)
    
    meas_wrs <- input$measured_wrs
    if (!is.null(meas_wrs) && is.na(meas_wrs)) meas_wrs <- NULL
    
    # Calculate Open-NL
    obj_opennl <- sii(speech = speech_input, threshold = htl_21, loss = loss_21, freq = d$f_21, prescription = "Open-NL", 
                      desensitization = input$desensitization, 
                      gender = input$gender, experience = input$experience, 
                      config = input$config, age = input$age, age_years = input$adult_age, 
                      coupling = input$coupling, module = input$module, transducer = input$transducer,
                      measured_wrs = meas_wrs, wrs_level = input$wrs_level)
    
    # Predict NAL-NL2 and DSL v5.0
    preset <- input$preset
    if (preset %in% c("a1", "a2", "a3", "a4", "a5", "a6", "a7")) {
      target_nalnl2 <- get_jd2011_target(preset, "NAL-NL2", d$f_21, target_level)
      target_dsl <- get_jd2011_target(preset, "DSL", d$f_21, target_level)
      target_cameq2 <- get_jd2011_target(preset, "CAMEQ2-HF", d$f_21, target_level)
      obj_nalnl2 <- sii(speech = speech_input, threshold = htl_21, freq = d$f_21, custom_gain = target_nalnl2, desensitization = input$desensitization, transducer = input$transducer, age = input$age, age_years = input$adult_age)
      obj_dsl <- sii(speech = speech_input, threshold = htl_21, freq = d$f_21, custom_gain = target_dsl, desensitization = input$desensitization, transducer = input$transducer, age = input$age, age_years = input$adult_age)
      obj_cameq2 <- sii(speech = speech_input, threshold = htl_21, freq = d$f_21, custom_gain = target_cameq2, desensitization = input$desensitization, transducer = input$transducer, age = input$age, age_years = input$adult_age)
      val_nalnl2_sii <- obj_nalnl2$sii
      val_dsl_sii <- obj_dsl$sii
      val_cameq2_sii <- obj_cameq2$sii
      name_nalnl2 <- "NAL-NL2 (JD2011)"
      name_dsl <- "DSL v5.0 (JD2011)"
      name_cameq2 <- "CAMEQ2-HF (JD2011)"
    } else {
      val_nalnl2_sii <- NA
      val_dsl_sii <- NA
      val_cameq2_sii <- NA
      
      val_nalnl2_sones <- NA
      val_dsl_sones <- NA
      val_cameq2_sones <- NA
      
      name_nalnl2 <- "NAL-NL2 (N/A for Custom)"
      name_dsl <- "DSL v5.0 (N/A for Custom)"
      name_cameq2 <- "CAMEQ2-HF (N/A for Custom)"
    }
    
    calc_loudness <- function(obj) {
      val <- calculate_loudness(obj)
      if (input$config == "unilateral") {
        return(val / 2) # The engine returns binaural sones by default
      } else {
        return(val)
      }
    }
    
    data.frame(
      Prescription = c("Unaided", "NAL-R", "Open-NL", name_nalnl2, name_dsl, name_cameq2),
      SII = sprintf("%.3f", c(obj_unaided$sii, obj_nalr$sii, obj_opennl$sii, val_nalnl2_sii, val_dsl_sii, val_cameq2_sii)),
      Sones = c(sprintf("%.1f", calc_loudness(obj_unaided)),
                sprintf("%.1f", calc_loudness(obj_nalr)),
                sprintf("%.1f", calc_loudness(obj_opennl)),
                ifelse(is.na(val_nalnl2_sii), "NA", sprintf("%.1f", calc_loudness(obj_nalnl2))),
                ifelse(is.na(val_dsl_sii), "NA", sprintf("%.1f", calc_loudness(obj_dsl))),
                ifelse(is.na(val_cameq2_sii), "NA", sprintf("%.1f", calc_loudness(obj_cameq2))))
    )
  }, align = "c")
  
  # Render the Compression Prescription
  output$compression_prescription <- renderUI({
    req(input$htl250)
    f_htl <- c(250, 500, 1000, 2000, 4000, 8000)
    threshold <- c(input$htl250, input$htl500, input$htl1000, 
                   input$htl2000, input$htl4000, input$htl8000)
    
    # Calculate prescription
    comp_presc <- prescribe_compression(freq = f_htl, threshold = threshold, module = input$module)
    
    obj <- sii_obj()
    dist_text <- ""
    if (!is.null(obj$distortion_category)) {
      dist_text <- p(strong("Distortion Category: "), span(class = "badge bg-warning", obj$distortion_category), " ", em(sprintf("(Predicted Score: %.1f%%)", obj$predicted_wrs)))
    }
    
    div(
      class = "p-3 bg-light rounded",
      h5(class = "text-primary", "Recommended Settings based on Patient Hearing"),
      p(strong("4-Frequency Average (PTA4): "), sprintf("%.1f dB HL", comp_presc$pta4)),
      p(strong("Compression Speed: "), span(class = "badge bg-info", comp_presc$speed), " ", em(comp_presc$speed_reason)),
      p(strong("Suggested Release Time: "), comp_presc$release_time),
      p(strong("Compression Ratio Note: "), comp_presc$ratio_note),
      dist_text
    )
  })
}

# Launch the Application 
shinyApp(ui = ui, server = server)
