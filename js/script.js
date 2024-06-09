// URLS
const URL = "https://pixel-api.codenestedu.fr";
const URL_TABLEAU = `${URL}/tableau`;
const URL_MODIFY_CELL = `${URL}/modifier-case`;
const URL_CHOOSE_TEAM = `${URL}/choisir-equipe`;

// DOM
const tabPixel = document.getElementById("table-pixel");
const paragraphTime = document.getElementById("time-to-wait");
const paragraphServerMessage = document.getElementById("server-message");
const buttonChooseTeam = document.getElementById("button-choose-team");

// Local Storage
const uid = document.getElementById("input-uid");
uid.value = localStorage.getItem("uid");

/**
 * Toggles the visibility of the password input field and updates the toggle image.
 */
const toggleVisibility = () => {
  const uid = document.getElementById("input-uid");
  if (uid.type === "password") {
    uid.type = "text";
    document.getElementById("toggle-img").src = "img/visible.png";
  } else {
    uid.type = "password";
    document.getElementById("toggle-img").src = "img/hide.png";
  }
};

/**
 * Method that checks UID length
 * @returns {boolean} true if the UID length is equal to 8
 */
const isUIDvalid = () => {
  const uid = document.getElementById("input-uid").value;
  if (uid.trim().length !== 8) {
    alert("Invalid UID");
    return false;
  }
  localStorage.setItem("uid", uid);
  return true;
};

/**
 * Checks if a team is selected.
 * @returns {boolean} Returns true if a team is selected, false otherwise.
 */
const isTeamSelected = () => {
  const team = document.getElementById("teams").value;
  if (team === "") {
    alert("Please select a team");
    return false;
  }
  return true;
};

/**
 * Updates the pixel grid of the table by erasing the old one and inserting a new one.
 */
const updateTab = () => {
  tabPixel.innerHTML = "";
  insertTab();
  fillTableInfo();
};

/**
 * Fetches data from the specified URL and inserts a table into the DOM based on the fetched data.
 */
const insertTab = async () => {
  try {
    const response = await fetch(URL_TABLEAU);
    if (!response.ok) {
      const error = await response.json();
      throw error.msg;
    }

    // Inserting tab
    const data = await response.json();
    data.forEach(function (rowArray, rowIndex) {
      let row = document.createElement("tr");
      rowArray.forEach(function (cellValue, colIndex) {
        let cell = document.createElement("td");
        cell.style.backgroundColor = cellValue;
        // On click updates the cell
        cell.addEventListener("click", function () {
          updateCell(rowIndex, colIndex);
        });
        row.appendChild(cell);
      });

      tabPixel.appendChild(row);
    });
  } catch (error) {
    console.error("Error:", error);
  }
};

/**
 * Fetches the time to wait based on the provided uid and updates
 * the paragraph element with the time (in seconds).
 */
const timeToWait = async () => {
  try {
    const uid = document.getElementById("input-uid").value;
    const URL_TIME = `${URL}/temps-attente?uid=${uid}`;

    const response = await fetch(URL_TIME);
    if (!response.ok) {
      // Error server message
      const error = await response.json();
      paragraphServerMessage.textContent = error.msg;
      paragraphServerMessage.style.color = "red";
    }

    const data = await response.json();
    // Round to seconds
    const timeWait = Math.floor(data.tempsAttente / 1000);
    paragraphTime.textContent = timeWait + " sec";
    // Setting text by default when timer is over
    if (timeWait === 0) {
      paragraphTime.textContent = "You can modify a pixel";
    }
  } catch (error) {
    console.error("Error:", error);
  }
};

/**
 * Fills the table with player information.
 * Retrieves player data from the server based on the provided UID,
 * and populates the table with the retrieved data.
 */
const fillTableInfo = async () => {
  try {
    const uid = document.getElementById("input-uid").value;
    const URL_PLAYER_LIST = `${URL}/liste-joueurs?uid=${uid}`;

    const response = await fetch(URL_PLAYER_LIST);
    if (!response.ok) {
      // Error server message
      const error = await response.json();
      paragraphServerMessage.textContent = error.msg;
      paragraphServerMessage.style.color = "red";
    }

    const data = await response.json();

    // Sort data based on lastModificationPixel in descending order
    data.sort(
      (a, b) =>
        new Date(b.lastModificationPixel) - new Date(a.lastModificationPixel)
    );

    // Limit to last 10 players
    const newData = data.slice(0, 10);

    // Table with players info
    const tbody = document.getElementsByTagName("tbody")[0];
    // Clear the table
    tbody.innerHTML = "";

    newData.forEach((item) => {
      const row = document.createElement("tr");

      // Name
      const nameCell = document.createElement("td");
      nameCell.textContent = item.nom;
      row.appendChild(nameCell);

      // Team
      const teamCell = document.createElement("td");
      teamCell.textContent = item.equipe;
      row.appendChild(teamCell);

      // Last modification
      const lastModifCell = document.createElement("td");
      lastModifCell.textContent = new Date(
        item.lastModificationPixel
      ).toLocaleString();
      row.appendChild(lastModifCell);

      // Banned (true/false)
      const bannedCell = document.createElement("td");
      bannedCell.textContent = item.banned;
      row.appendChild(bannedCell);

      // Number of pixels modified
      const nbPixels = document.createElement("td");
      nbPixels.textContent = item.nbPixelsModifies;
      row.appendChild(nbPixels);

      tbody.appendChild(row);
    });
  } catch (error) {
    console.error("Error:", error);
  }
};

/**
 * Chooses a team based on a selection of the student.
 * Sends a PUT request to the server to update the student's team.
 * Displays an alert if the UID is invalid or an error occurs during the request.
 */
const chooseTeam = async () => {
  try {
    if (isUIDvalid()) {
      const response = await fetch(URL_CHOOSE_TEAM, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uid: document.getElementById("input-uid").value,
          nouvelleEquipe: document.getElementById("teams").value,
        }),
      });

      if (!response.ok) {
        // Error server message
        const error = await response.json();
        paragraphServerMessage.textContent = error.msg;
        paragraphServerMessage.style.color = "red";
      } else {
        const data = await response.json();

        fillTableInfo();
        updateTab();

        // Success server message
        paragraphServerMessage.textContent = data.msg;
        paragraphServerMessage.style.color = "green";
      }
    }
  } catch (error) {
    console.error("Error:", error);
  }
};

/**
 * Updates a cell in the pixel grid.
 *
 * @param {number} rowIndex - row index
 * @param {number} colIndex - column index
 */
const updateCell = async (rowIndex, colIndex) => {
  try {
    if (isUIDvalid() && isTeamSelected()) {
      // Setting timer
      timeToWait();
      // Update the timer each second
      setInterval(timeToWait, 1000);

      const response = await fetch(URL_MODIFY_CELL, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          color: document.getElementById("color").value,
          uid: document.getElementById("input-uid").value,
          col: colIndex,
          row: rowIndex,
        }),
      });

      if (!response.ok) {
        // Error server message
        const error = await response.json();
        paragraphServerMessage.textContent = error.msg;
        paragraphServerMessage.style.color = "red";
      } else {
        const data = await response.json();

        fillTableInfo();
        updateTab();

        // Success server message
        paragraphServerMessage.textContent = data.msg;
        paragraphServerMessage.style.color = "green";
      }
    }
  } catch (error) {
    console.error("Error:", error);
  }
};

// Event listeners
buttonChooseTeam.addEventListener("click", chooseTeam);

// Start
insertTab();
