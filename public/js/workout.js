
document.addEventListener("DOMContentLoaded", function () {


    //   PAGE ELEMENTS


    const filterButtons = document.querySelectorAll(".filter-btn");
    const workoutGrid = document.querySelector(".workout-grid");

    const modalToggle = document.getElementById("modal-toggle");
    const workoutNameInput = document.getElementById("workoutName");
    const workoutType = document.getElementById("workoutType");
    const workoutDuration = document.getElementById("workoutDuration");
    const exerciseList = document.querySelector(".exercise-list");

    const addExerciseButton = document.querySelector(".add-exercise-btn");
    const saveButton = document.querySelector(".btn-save");

    if (!workoutGrid) {
        console.error("Workout grid was not found.");
        return;
    }



    //  CREATE THE WORKOUT SESSION PANEL


    const sessionPanel = document.createElement("section");

    sessionPanel.id = "workout-session-panel";
    sessionPanel.className = "workout-session-panel";
    sessionPanel.hidden = true;

    sessionPanel.innerHTML = `
        <h2 id="session-workout-name">Workout Session</h2>

        <p id="session-status">Ready to work out!</p>

        <div id="session-timer" class="session-timer">00:00:00</div>

        <div class="session-controls">
            <button type="button" id="pause-resume-btn">Pause</button>
            <button type="button" id="finish-workout-btn">
                Finish Workout
            </button>
        </div>

        <div id="session-summary" hidden>
            <h3>Workout Completed!</h3>
            <p id="session-summary-details"></p>
        </div>
    `;

    workoutGrid.parentNode.insertBefore(sessionPanel, workoutGrid);

    const sessionNameElement =
        document.getElementById("session-workout-name");

    const sessionStatusElement =
        document.getElementById("session-status");

    const sessionTimerElement =
        document.getElementById("session-timer");

    const pauseResumeButton =
        document.getElementById("pause-resume-btn");

    const finishWorkoutButton =
        document.getElementById("finish-workout-btn");

    const sessionSummary =
        document.getElementById("session-summary");

    const sessionSummaryDetails =
        document.getElementById("session-summary-details");



    // 3. WORKOUT SESSION VARIABLES


    let activeSessionId = null;
    let activeWorkoutName = "";

    // Accumulated active workout time, in seconds.
    let elapsedSeconds = 0;

    // Start time of the current active timer segment.
    let segmentStartTime = null;

    let timerInterval = null;
    let workoutPaused = false;
    let sessionBusy = false;



    //  TIMER FUNCTIONS


    function getElapsedSeconds() {
        if (segmentStartTime === null) {
            return elapsedSeconds;
        }

        return elapsedSeconds + Math.floor(
            (Date.now() - segmentStartTime) / 1000
        );
    }

    function formatDuration(totalSeconds) {
        const hours = Math.floor(totalSeconds / 3600);

        const minutes = Math.floor(
            (totalSeconds % 3600) / 60
        );

        const seconds = totalSeconds % 60;

        return [hours, minutes, seconds]
            .map(function (value) {
                return String(value).padStart(2, "0");
            })
            .join(":");
    }

    function updateSessionTimer() {
        sessionTimerElement.textContent =
            formatDuration(getElapsedSeconds());
    }

    function stopTimer() {
        if (timerInterval !== null) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }

    function startTimer() {
        segmentStartTime = Date.now();

        stopTimer();

        timerInterval = setInterval(function () {
            updateSessionTimer();
        }, 250);

        updateSessionTimer();
    }



    //  START A WORKOUT AND SAVE IT TO THE DATABASE


    async function startWorkoutSession(workoutName, button) {

        // Prevent starting another session while one is active.
        if (activeSessionId !== null || sessionBusy) {
            alert(
                "You already have a workout session. " +
                "Finish it before starting another."
            );

            return;
        }

        const confirmed = window.confirm(
            "Start the workout: " + workoutName + "?"
        );

        if (!confirmed) {
            return;
        }

        sessionBusy = true;
        button.disabled = true;

        try {
            const response = await fetch(
                "/backend/workout_session.php",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        action: "start",
                        workout_name: workoutName
                    })
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "Could not start workout."
                );
            }

            // The PHP endpoint creates the database session.
            activeSessionId = Number(result.session_id);
            activeWorkoutName = workoutName;

            elapsedSeconds = 0;
            segmentStartTime = null;
            workoutPaused = false;

            // Update the session panel.
            sessionNameElement.textContent = workoutName;

            sessionStatusElement.textContent =
                "Workout in progress";

            sessionTimerElement.textContent = "00:00:00";

            sessionSummary.hidden = true;
            sessionSummaryDetails.textContent = "";

            pauseResumeButton.textContent = "Pause";
            pauseResumeButton.disabled = false;

            finishWorkoutButton.disabled = false;

            // Prevent multiple simultaneous sessions.
            document.querySelectorAll(".start-btn").forEach(
                function (item) {
                    item.disabled = true;
                }
            );

            // Show the panel and start the timer.
            sessionPanel.hidden = false;

            startTimer();

            sessionPanel.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        } catch (error) {
            console.error("Could not start workout:", error);

            alert(
                "Unable to start workout.\n\n" + error.message
            );

            button.disabled = false;

        } finally {
            sessionBusy = false;
        }
    }



    // PAUSE AND RESUME THE WORKOUT


    pauseResumeButton.addEventListener("click", function () {

        if (activeSessionId === null || sessionBusy) {
            return;
        }

        if (!workoutPaused) {

            // Save elapsed time before pausing.
            elapsedSeconds = getElapsedSeconds();

            segmentStartTime = null;

            stopTimer();

            workoutPaused = true;

            pauseResumeButton.textContent = "Resume";

            sessionStatusElement.textContent =
                "Workout paused";

            updateSessionTimer();

        } else {

            // Start a new active timer segment.
            workoutPaused = false;

            pauseResumeButton.textContent = "Pause";

            sessionStatusElement.textContent =
                "Workout in progress";

            startTimer();
        }
    });



    // FINISH THE WORKOUT AND SAVE ITS DURATION


    finishWorkoutButton.addEventListener(
        "click",
        async function () {

            if (activeSessionId === null || sessionBusy) {
                return;
            }

            const confirmed = window.confirm(
                "Finish and save this workout?"
            );

            if (!confirmed) {
                return;
            }

            sessionBusy = true;

            pauseResumeButton.disabled = true;
            finishWorkoutButton.disabled = true;

            // Freeze the timer while the request is processed.
            elapsedSeconds = getElapsedSeconds();

            segmentStartTime = null;

            stopTimer();

            updateSessionTimer();

            try {
                const response = await fetch(
                    "/backend/workout_session.php",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json"
                        },

                        body: JSON.stringify({
                            action: "finish",
                            session_id: activeSessionId,
                            duration_seconds: elapsedSeconds
                        })
                    }
                );

                const result = await response.json();

                if (!response.ok || !result.success) {
                    throw new Error(
                        result.message || "Could not save workout."
                    );
                }

                const completedName = activeWorkoutName;
                const completedDuration = elapsedSeconds;

                // Display the completion summary.
                sessionStatusElement.textContent =
                    "Workout saved successfully!";

                sessionSummaryDetails.textContent =
                    completedName + " — " +
                    formatDuration(completedDuration) +
                    " (HH:MM:SS)";

                sessionSummary.hidden = false;

                // Reset the active session state.
                activeSessionId = null;
                activeWorkoutName = "";
                workoutPaused = false;

                // Allow another workout to be started.
                document.querySelectorAll(".start-btn").forEach(
                    function (item) {
                        item.disabled = false;
                    }
                );

                pauseResumeButton.disabled = true;

                // The finish button is disabled until another
                // workout starts.
                finishWorkoutButton.disabled = true;

            } catch (error) {
                console.error("Could not finish workout:", error);

                alert(
                    "Could not save the workout.\n\n" +
                    error.message +
                    "\n\nThe timer is stopped. You can try " +
                    "Finish Workout again."
                );

                // Keep the session ID so saving can be retried.
                pauseResumeButton.disabled = false;
                finishWorkoutButton.disabled = false;

            } finally {
                sessionBusy = false;
            }
        }
    );



    // WORKOUT CATEGORY FILTERS


    filterButtons.forEach(function (button) {

        button.addEventListener("click", function () {

            const selectedCategory =
                button.textContent.trim().toLowerCase();

            filterButtons.forEach(function (item) {
                item.classList.remove("active");
            });

            button.classList.add("active");

            // Includes original, custom, and database cards.
            const workoutCards =
                document.querySelectorAll(".workout-card");

            workoutCards.forEach(function (card) {

                const tag = card.querySelector(".tag");

                if (!tag) {
                    return;
                }

                const category =
                    tag.textContent.trim().toLowerCase();

                if (
                    selectedCategory === "all" ||
                    category === selectedCategory
                ) {
                    card.style.display = "";
                } else {
                    card.style.display = "none";
                }
            });
        });
    });



    // ONE START HANDLER FOR ALL WORKOUT CARDS


    // Event delegation also works for cards created later.
    // Do not add separate click handlers to individual cards.

    workoutGrid.addEventListener("click", function (event) {

        const button = event.target.closest(".start-btn");

        if (!button || !workoutGrid.contains(button)) {
            return;
        }

        const card = button.closest(".workout-card");

        if (!card) {
            return;
        }

        const title = card.querySelector("h3");

        if (!title) {
            return;
        }

        startWorkoutSession(
            title.textContent.trim(),
            button
        );
    });



    // ADD ANOTHER EXERCISE FIELD


    if (addExerciseButton && exerciseList) {

        addExerciseButton.addEventListener("click", function () {

            const exerciseItem = document.createElement("div");

            exerciseItem.className = "exercise-item";

            const input = document.createElement("input");

            input.type = "text";
            input.placeholder =
                "Exercise name (e.g., Push-ups)";

            const removeButton = document.createElement("span");

            removeButton.className = "remove-btn";
            removeButton.textContent = "×";

            removeButton.setAttribute("role", "button");
            removeButton.setAttribute("tabindex", "0");
            removeButton.setAttribute(
                "aria-label",
                "Remove exercise"
            );

            exerciseItem.appendChild(input);
            exerciseItem.appendChild(removeButton);

            exerciseList.appendChild(exerciseItem);
        });


        // REMOVE AN EXERCISE FIELD
     

        exerciseList.addEventListener("click", function (event) {

            if (!event.target.classList.contains("remove-btn")) {
                return;
            }

            const exerciseItems =
                exerciseList.querySelectorAll(".exercise-item");

            // Keep at least one exercise field.
            if (exerciseItems.length > 1) {

                event.target.closest(".exercise-item").remove();

            } else {

                alert("Keep at least one exercise field.");
            }
        });


        // Also support Enter and Space for keyboard users.
        exerciseList.addEventListener("keydown", function (event) {

            if (
                !event.target.classList.contains("remove-btn") ||
                (event.key !== "Enter" && event.key !== " ")
            ) {
                return;
            }

            event.preventDefault();

            const exerciseItems =
                exerciseList.querySelectorAll(".exercise-item");

            if (exerciseItems.length > 1) {

                event.target.closest(".exercise-item").remove();

            } else {

                alert("Keep at least one exercise field.");
            }
        });
    }


    // SAVE A CUSTOM WORKOUT TO LOCAL STORAGE

    if (
        saveButton &&
        workoutNameInput &&
        workoutType &&
        workoutDuration &&
        exerciseList &&
        modalToggle
    ) {

        saveButton.addEventListener("click", function () {

            const name = workoutNameInput.value.trim();
            const type = workoutType.value;
            const duration = Number(workoutDuration.value);

            const exercises = Array.from(
                exerciseList.querySelectorAll("input")
            )
                .map(function (input) {
                    return input.value.trim();
                })
                .filter(function (exercise) {
                    return exercise !== "";
                });

            if (!name) {
                alert("Please enter a workout name.");
                workoutNameInput.focus();
                return;
            }

            if (
                !Number.isInteger(duration) ||
                duration < 1
            ) {
                alert(
                    "Please enter a duration of at least 1 minute."
                );

                workoutDuration.focus();
                return;
            }

            if (exercises.length === 0) {
                alert("Please enter at least one exercise.");
                return;
            }

            const customWorkout = {
                id: Date.now(),
                name: name,
                type: type,
                duration: duration,
                exercises: exercises
            };

            let savedWorkouts = [];

            try {
                savedWorkouts = JSON.parse(
                    localStorage.getItem("customWorkouts") || "[]"
                );

                if (!Array.isArray(savedWorkouts)) {
                    savedWorkouts = [];
                }

            } catch (error) {

                alert(
                    "Could not read saved workouts from this browser."
                );

                return;
            }

            savedWorkouts.push(customWorkout);

            try {
                localStorage.setItem(
                    "customWorkouts",
                    JSON.stringify(savedWorkouts)
                );

            } catch (error) {

                alert(
                    "Could not save the workout in this browser."
                );

                return;
            }

            // Add the new card to the existing grid.
            addWorkoutCard(customWorkout);

            // Close and reset the form.
            modalToggle.checked = false;

            workoutNameInput.value = "";
            workoutType.value = "strength";
            workoutDuration.value = "";

            exerciseList.innerHTML = `
                <div class="exercise-item">
                    <input
                        type="text"
                        placeholder="Exercise name (e.g., Squats)"
                    >
                    <span class="remove-btn">×</span>
                </div>

                <div class="exercise-item">
                    <input
                        type="text"
                        placeholder="Exercise name (e.g., Lunges)"
                    >
                    <span class="remove-btn">×</span>
                </div>
            `;

            alert("Custom workout saved successfully!");
        });
    }


    // CREATE A CUSTOM WORKOUT CARD
    

    function addWorkoutCard(workout) {

        const card = document.createElement("div");

        card.className = "workout-card";
        card.dataset.customWorkoutId = workout.id;

        const image = document.createElement("div");

        image.className = "card-image";

        const tag = document.createElement("span");

        tag.className = "tag " + workout.type;

        tag.textContent =
            workout.type.charAt(0).toUpperCase() +
            workout.type.slice(1);

        image.appendChild(tag);

        const content = document.createElement("div");

        content.className = "card-content";

        const title = document.createElement("h3");

        title.textContent = workout.name;

        const stats = document.createElement("div");

        stats.className = "card-stats";

        const duration = document.createElement("span");

        duration.textContent = "⏱ " + workout.duration + " min";

        stats.appendChild(duration);

        const exerciseDetails = document.createElement("p");

        exerciseDetails.textContent =
            "Exercises: " + workout.exercises.join(", ");

        const startButton = document.createElement("button");

        startButton.className = "start-btn";
        startButton.type = "button";
        startButton.textContent = "Start Workout";

        content.appendChild(title);
        content.appendChild(stats);
        content.appendChild(exerciseDetails);
        content.appendChild(startButton);

        card.appendChild(image);
        card.appendChild(content);

        workoutGrid.appendChild(card);
    }


    // RESTORE CUSTOM WORKOUTS FROM LOCAL STORAGE
   

    let savedWorkouts = [];

    try {
        savedWorkouts = JSON.parse(
            localStorage.getItem("customWorkouts") || "[]"
        );

    } catch (error) {

        savedWorkouts = [];
    }

    if (Array.isArray(savedWorkouts)) {

        savedWorkouts.forEach(function (workout) {

            if (
                workout &&
                typeof workout.name === "string" &&
                typeof workout.type === "string" &&
                Number.isFinite(workout.duration) &&
                Array.isArray(workout.exercises)
            ) {
                addWorkoutCard(workout);
            }
        });
    }


    
    // LOAD EXERCISES FROM THE PHP API
    
    async function loadDatabaseExercises() {

        try {
            const response = await fetch("/backend/exercises.php");

            if (!response.ok) {
                throw new Error(
                    "HTTP error: " + response.status
                );
            }

            const result = await response.json();

            if (
                !result.success ||
                !Array.isArray(result.data)
            ) {
                throw new Error(
                    "Invalid exercise data received."
                );
            }

            result.data.forEach(function (exercise) {

                // Prevent duplicate database exercise cards.
                const existingCard = workoutGrid.querySelector(
                    '[data-exercise-id="' +
                    exercise.exercise_id +
                    '"]'
                );

                if (existingCard) {
                    return;
                }

                const card = document.createElement("div");

                card.className =
                    "workout-card database-exercise-card";

                card.dataset.exerciseId = exercise.exercise_id;

                // Image area using the existing card styling.
                const image = document.createElement("div");

                image.className = "card-image";

                image.style.backgroundImage =
                    "linear-gradient(135deg, #333333, #777777)";

                // Category tag.
                const muscleGroup =
                    (exercise.muscle_group || "Other").trim();

                const category =
                    muscleGroup.toLowerCase() === "cardio"
                        ? "cardio"
                        : "strength";

                const tag = document.createElement("span");

                tag.className = "tag " + category;
                tag.textContent = muscleGroup;

                image.appendChild(tag);

                // Card content.
                const content = document.createElement("div");

                content.className = "card-content";

                const title = document.createElement("h3");

                title.textContent = exercise.exercise_name;

                const stats = document.createElement("div");

                stats.className = "card-stats";

                const group = document.createElement("span");

                group.textContent =
                    "Muscle group: " + muscleGroup;

                stats.appendChild(group);

                // Start button for each database exercise.
                const startButton = document.createElement("button");

                startButton.className = "start-btn";
                startButton.type = "button";
                startButton.textContent = "Start Workout";

                content.appendChild(title);
                content.appendChild(stats);
                content.appendChild(startButton);

                card.appendChild(image);
                card.appendChild(content);

                workoutGrid.appendChild(card);
            });

        } catch (error) {

            console.error(
                "Could not load database exercises:",
                error
            );
        }
    }


    // LOAD DATABASE EXERCISES WHEN THE PAGE OPENS
    

    loadDatabaseExercises();

});
