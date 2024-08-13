document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('schedulerForm');
    const destinationFields = document.getElementById('destinationFields');
    const addDestinationButton = document.getElementById('addDestination');
    const scheduleResults = document.getElementById('scheduleResults');

    // Function to add a new destination input field
    function addDestinationField() {
        const newField = document.createElement('input');
        newField.setAttribute('type', 'text');
        newField.setAttribute('class', 'form-control destination');
        newField.setAttribute('placeholder', 'Enter destination address');
        destinationFields.appendChild(newField);
    }

    // Add initial destination field
    addDestinationField();

    // Add event listener to add button
    addDestinationButton.addEventListener('click', function () {
        addDestinationField();
    });

    async function calculateSchedule(startingAddress, destinations, startTime, duration) {
        let currentAddress = startingAddress;
        let currentTime = startTime;
        let remainingDestinations = [...destinations]; // Clone the array to avoid modifying the original

        try {
            // Convert destinations to an array of objects with address and travelTime
            let destinationsWithTravelTime = await Promise.all(destinations.map(async (destination) => {
                return {
                    address: destination,
                    travelTime: await getTravelTime(startingAddress, destination)
                };
            }));

            // Sort destinations by travelTime
            destinationsWithTravelTime.sort((a, b) => a.travelTime - b.travelTime);

            // Schedule each destination
            for (let destination of destinationsWithTravelTime) {
                currentTime = addMinutes(currentTime, destination.travelTime + duration);

                let result = document.createElement('p');
                result.textContent = `Appointment at ${destination.address} is scheduled at ${currentTime}.`;
                scheduleResults.appendChild(result);

                currentAddress = destination.address;
            }
        } catch (error) {
            console.error('Error in scheduling:', error);
            scheduleResults.textContent = 'Error in scheduling. Please check the input data.';
        }
    }

    async function getTravelTime(origin, destination) {
        try {
            const response = await fetch('http://localhost:3000/getTravelTime', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ origin, destination })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (!data.rows || !data.rows[0].elements) {
                throw new Error('Invalid data structure returned from API');
            }

            const travelTimeValue = data.rows[0].elements[0].duration.value;
            if (isNaN(travelTimeValue)) {
                console.error('Travel time is NaN for', { origin, destination });
                return 0; // Default value or handle error
            }

            return travelTimeValue / 60; // Converting seconds to minutes
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }

    function addMinutes(time, minutes) {
        console.log(`addMinutes called with time: ${time}, minutes: ${minutes}`);
        let [hours, mins] = time.split(':').map(Number);
        console.log(`Parsed time - Hours: ${hours}, Minutes: ${mins}`);

        mins += minutes;
        hours += Math.floor(mins / 60);
        mins %= 60;
        hours %= 24; // Ensure hours wrap around if exceeding 24

        const newTime = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
        console.log(`New time after adding minutes: ${newTime}`);
        return newTime;
    }

    // Handle form submission
    form.addEventListener('submit', function (event) {
        event.preventDefault();
        scheduleResults.innerHTML = ''; // Clear previous results

        const startTime = form.querySelector('#startTime').value;
        const duration = parseInt(form.querySelector('#appointmentDuration').value, 10);
        const startingAddress = form.querySelector('#startingAddress').value;
        const destinations = Array.from(form.querySelectorAll('.destination')).map(field => field.value);

        console.log('Form submitted with:', { startTime, duration, startingAddress, destinations });

        if (isNaN(duration)) {
            console.error('Duration is not a valid number');
            return;
        }

        if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(startTime)) {
            console.error('Start time is not in valid HH:mm format');
            return;
        }

        calculateSchedule(startingAddress, destinations, startTime, duration);
    });
});
