let field = Array(gameData.size * gameData.size).fill(0);
let currentScore = 0;
let previousState = null;
let gameOver = false;
let recordSaved = false;
let records = [];
let touchStartX = null;
let touchStartY = null;
let isAnimating = false;

try {
    records = JSON.parse(localStorage.getItem("2048-records")) || [];

    if (!Array.isArray(records)) {
        records = [];
    }
} catch {
    records = [];
}

const main = document.createElement("main");
main.className = "game";
document.body.append(main);

const title = document.createElement("h1");
title.textContent = "Новогодняя 2048";
title.className = "game__title";
main.append(title);

const score = document.createElement("p");
score.textContent = "Счёт: ";
score.className = "game__score";

const scoreValue = document.createElement("span");
scoreValue.textContent = "0";

score.append(scoreValue);
main.append(score);

const actions = document.createElement("div");
actions.className = "game__actions";
main.append(actions);

const restartButton = document.createElement("button");
restartButton.textContent = "Новая игра";
restartButton.type = "button";
restartButton.className = "game__button";

const undoButton = document.createElement("button");
undoButton.textContent = "Отменить ход";
undoButton.type = "button";
undoButton.className = "game__button";
undoButton.disabled = true;

const recordsButton = document.createElement("button");
recordsButton.textContent = "Рекорды";
recordsButton.type = "button";
recordsButton.className = "game__button";

actions.append(restartButton, undoButton, recordsButton);

const board = document.createElement("div");
board.className = "game__board";
main.append(board);

const gameOverMessage = document.createElement("p");
gameOverMessage.textContent = "Игра окончена! Больше нет доступных ходов.";
gameOverMessage.className = "game__message";
gameOverMessage.hidden = true;
main.append(gameOverMessage);

const recordForm = document.createElement("form");
recordForm.className = "record-form";
recordForm.hidden = true;
main.append(recordForm);

const nameLabel = document.createElement("label");
nameLabel.textContent = "Твоё имя";
nameLabel.htmlFor = "player-name";
recordForm.append(nameLabel);

const nameInput = document.createElement("input");
nameInput.id = "player-name";
nameInput.type = "text";
nameInput.name = "playerName";
nameInput.maxLength = 30;
nameInput.required = true;
nameInput.className = "record-form__input";
recordForm.append(nameInput);

const saveRecordButton = document.createElement("button");
saveRecordButton.textContent = "Сохранить результат";
saveRecordButton.type = "submit";
saveRecordButton.className = "game__button";
recordForm.append(saveRecordButton);

const recordsDialog = document.createElement("dialog");
recordsDialog.className = "records";
main.append(recordsDialog);

const recordsTitle = document.createElement("h2");
recordsTitle.textContent = "Таблица рекордов";
recordsTitle.id = "records-title";
recordsDialog.append(recordsTitle);

recordsDialog.setAttribute("aria-labelledby", "records-title");

const recordsContent = document.createElement("div");
recordsContent.className = "records__content";
recordsDialog.append(recordsContent);

const closeRecordsButton = document.createElement("button");
closeRecordsButton.textContent = "Закрыть";
closeRecordsButton.type = "button";
closeRecordsButton.className = "game__button";
recordsDialog.append(closeRecordsButton);

const cells = [];

for (let index = 0; index < field.length; index++) {
    const cell = document.createElement("div");
    cell.className = "game__cell";
    board.append(cell);
    cells.push(cell);
}

const tilesLayer = document.createElement("div");
tilesLayer.className = "game__tiles";
board.append(tilesLayer);

function addRandomTile() {
    const emptyCells = [];

    field.forEach(function (value, index) {
        if (value === 0) {
            emptyCells.push(index);
        }
    });

    if (emptyCells.length === 0) {
        return;
    }

    const randomIndex = Math.floor(Math.random() * emptyCells.length);
    const cellIndex = emptyCells[randomIndex];

    const valueIndex = Math.floor(Math.random() * gameData.tileValues.length);
    field[cellIndex] = gameData.tileValues[valueIndex];
}

function saveGame() {
    const state = {
        field: field,
        score: currentScore,
        previousState: previousState,
        gameOver: gameOver,
        recordSaved: recordSaved
    };

    try {
        localStorage.setItem("2048-game", JSON.stringify(state));
    } catch (error) {
        console.error("Не удалось сохранить игру:", error);
    }
}

function renderField() {
    tilesLayer.replaceChildren();

    field.forEach(function (value, index) {
        if (value === 0) {
            return;
        }

        const tile = document.createElement("div");
        tile.className = "game__cell game__cell--filled";
        tile.classList.add("game__cell--" + value);
        tile.textContent = value;
        tile.dataset.index = index;

        if (value >= 128) {
            tile.classList.add("game__cell--large");
        }

        if (value > 2048) {
            tile.style.backgroundColor =
                "hsl(" + (Math.log2(value) * 37 % 360) + ", 45%, 28%)";
        }

        tile.style.left = cells[index].offsetLeft + "px";
        tile.style.top = cells[index].offsetTop + "px";
        tile.style.width = cells[index].offsetWidth + "px";
        tile.style.height = cells[index].offsetHeight + "px";

        tilesLayer.append(tile);
    });

    scoreValue.textContent = currentScore;
    saveGame();
}

function moveLine(line) {
    const tiles = [];

    line.forEach(function (value, index) {
        if (value !== 0) {
            tiles.push({
                value: value,
                sources: [index]
            });
        }
    });

    let index = 0;

    while (index < tiles.length - 1) {
        if (tiles[index].value === tiles[index + 1].value) {
            tiles[index].value = tiles[index].value * 2;
            currentScore = currentScore + tiles[index].value;

            tiles[index].sources = tiles[index].sources.concat(
                tiles[index + 1].sources
            );

            tiles.splice(index + 1, 1);

            if (index > 0) {
                index--;
            }
        } else {
            index++;
        }
    }

    const values = [];
    const movements = [];

    tiles.forEach(function (tile, targetIndex) {
        values.push(tile.value);

        tile.sources.forEach(function (sourceIndex) {
            movements.push({
                from: sourceIndex,
                to: targetIndex,
                merged: tile.sources.length > 1
            });
        });
    });

    while (values.length < gameData.size) {
        values.push(0);
    }

    return {
        values: values,
        movements: movements
    };
}

async function animateMove(movements, nextField, stateBeforeMove) {
    isAnimating = true;
    restartButton.disabled = true;
    undoButton.disabled = true;
    recordsButton.disabled = true;

    previousState = stateBeforeMove;
    field = nextField;
    addRandomTile();
    checkGameOver();
    saveGame();

    const animations = [];

    movements.forEach(function (movement) {
        const tile = tilesLayer.querySelector(
            '[data-index="' + movement.from + '"]'
        );

        if (!tile || movement.from === movement.to) {
            return;
        }

        const deltaX = cells[movement.to].offsetLeft -
            cells[movement.from].offsetLeft;
        const deltaY = cells[movement.to].offsetTop -
            cells[movement.from].offsetTop;

        const animation = tile.animate([
            {
                transform: "translate(0, 0)"
            },
            {
                transform: "translate(" + deltaX + "px, " + deltaY + "px)"
            }
        ], {
            duration: 160,
            easing: "ease-in-out",
            fill: "forwards"
        });

        animations.push(animation.finished);
    });

    await Promise.allSettled(animations);

    renderField();

    const mergedCells = [];

    movements.forEach(function (movement) {
        if (movement.merged && !mergedCells.includes(movement.to)) {
            mergedCells.push(movement.to);
        }
    });

    const mergeAnimations = [];

    mergedCells.forEach(function (index) {
        const tile = tilesLayer.querySelector(
            '[data-index="' + index + '"]'
        );

        if (tile) {
            const animation = tile.animate([
                { transform: "scale(1)" },
                { transform: "scale(1.12)" },
                { transform: "scale(1)" }
            ], {
                duration: 140,
                easing: "ease-out"
            });

            mergeAnimations.push(animation.finished);
        }
    });

    await Promise.allSettled(mergeAnimations);

    isAnimating = false;
    restartButton.disabled = false;
    recordsButton.disabled = false;
    undoButton.disabled = previousState === null || gameOver;

    renderField();
}

function moveHorizontal(direction) {
    if (gameOver || recordsDialog.open || isAnimating) {
        return;
    }

    const stateBeforeMove = {
        field: field.slice(),
        score: currentScore
    };

    const nextField = [];
    const movements = [];

    for (let row = 0; row < gameData.size; row++) {
        const start = row * gameData.size;
        const line = field.slice(start, start + gameData.size);

        if (direction === "right") {
            line.reverse();
        }

        const result = moveLine(line);
        const movedLine = result.values;

        result.movements.forEach(function (movement) {
            let from = movement.from;
            let to = movement.to;

            if (direction === "right") {
                from = gameData.size - 1 - from;
                to = gameData.size - 1 - to;
            }

            movements.push({
                from: start + from,
                to: start + to,
                merged: movement.merged
            });
        });

        if (direction === "right") {
            movedLine.reverse();
        }

        nextField.push(...movedLine);
    }

    const changed = field.some(function (value, index) {
        return value !== nextField[index];
    });

    if (!changed) {
        return;
    }

    animateMove(movements, nextField, stateBeforeMove);
}

function moveVertical(direction) {
    if (gameOver || recordsDialog.open || isAnimating) {
        return;
    }

    const stateBeforeMove = {
        field: field.slice(),
        score: currentScore
    };

    const nextField = field.slice();
    const movements = [];

    for (let column = 0; column < gameData.size; column++) {
        const line = [];

        for (let row = 0; row < gameData.size; row++) {
            const index = row * gameData.size + column;
            line.push(field[index]);
        }

        if (direction === "down") {
            line.reverse();
        }

        const result = moveLine(line);
        const movedLine = result.values;

        result.movements.forEach(function (movement) {
            let from = movement.from;
            let to = movement.to;

            if (direction === "down") {
                from = gameData.size - 1 - from;
                to = gameData.size - 1 - to;
            }

            movements.push({
                from: from * gameData.size + column,
                to: to * gameData.size + column,
                merged: movement.merged
            });
        });

        if (direction === "down") {
            movedLine.reverse();
        }

        for (let row = 0; row < gameData.size; row++) {
            const index = row * gameData.size + column;
            nextField[index] = movedLine[row];
        }
    }

    const changed = field.some(function (value, index) {
        return value !== nextField[index];
    });

    if (!changed) {
        return;
    }

    animateMove(movements, nextField, stateBeforeMove);
}

function isGameOver() {
    if (field.includes(0)) {
        return false;
    }

    for (let row = 0; row < gameData.size; row++) {
        for (let column = 0; column < gameData.size; column++) {
            const index = row * gameData.size + column;

            if (column < gameData.size - 1) {
                if (field[index] === field[index + 1]) {
                    return false;
                }
            }

            if (row < gameData.size - 1) {
                if (field[index] === field[index + gameData.size]) {
                    return false;
                }
            }
        }
    }

    return true;
}

function checkGameOver() {
    gameOver = isGameOver();

    if (gameOver) {
        previousState = null;
        undoButton.disabled = true;
        gameOverMessage.hidden = false;
        recordForm.hidden = recordSaved;
    }
}

function renderRecords() {
    recordsContent.replaceChildren();

    if (records.length === 0) {
        const message = document.createElement("p");
        message.textContent = "Пока нет сохранённых результатов.";
        recordsContent.append(message);
        return;
    }

    const table = document.createElement("table");
    table.className = "records__table";

    const head = document.createElement("thead");
    const headerRow = document.createElement("tr");

    const nameHeader = document.createElement("th");
    nameHeader.textContent = "Имя";
    nameHeader.scope = "col";

    const scoreHeader = document.createElement("th");
    scoreHeader.textContent = "Очки";
    scoreHeader.scope = "col";

    const dateHeader = document.createElement("th");
    dateHeader.textContent = "Дата";
    dateHeader.scope = "col";

    headerRow.append(nameHeader, scoreHeader, dateHeader);
    head.append(headerRow);

    const body = document.createElement("tbody");

    records.forEach(function (record) {
        const row = document.createElement("tr");

        const nameCell = document.createElement("td");
        nameCell.textContent = record.name;

        const scoreCell = document.createElement("td");
        scoreCell.textContent = record.score;

        const dateCell = document.createElement("td");
        dateCell.textContent = new Date(record.date).toLocaleString("ru-RU");

        row.append(nameCell, scoreCell, dateCell);
        body.append(row);
    });

    table.append(head, body);
    recordsContent.append(table);
}

function isValidState(state) {
    if (!state || !Array.isArray(state.field)) {
        return false;
    }

    if (state.field.length !== gameData.size * gameData.size) {
        return false;
    }

    const validCells = state.field.every(function (value) {
        return Number.isSafeInteger(value) &&
            (value === 0 || (value >= 2 && Number.isInteger(Math.log2(value))));
    });

    return validCells &&
        Number.isSafeInteger(state.score) &&
        state.score >= 0;
}

function restoreGame() {
    let state;

    try {
        state = JSON.parse(localStorage.getItem("2048-game"));
    } catch {
        return false;
    }

    if (!isValidState(state)) {
        return false;
    }

    field = state.field.slice();
    currentScore = state.score;
    gameOver = isGameOver();
    recordSaved = gameOver && state.recordSaved === true;
    previousState = null;

    if (!gameOver && isValidState(state.previousState)) {
        previousState = {
            field: state.previousState.field.slice(),
            score: state.previousState.score
        };
    }

    undoButton.disabled = previousState === null || gameOver;
    gameOverMessage.hidden = !gameOver;
    recordForm.hidden = !gameOver || recordSaved;

    if (recordSaved) {
        gameOverMessage.textContent = "Ваш рекорд сохранён!";
    } else {
        gameOverMessage.textContent = "Игра окончена! Больше нет доступных ходов.";
    }

    renderField();
    return true;
}

function startGame() {
    field = Array(gameData.size * gameData.size).fill(0);
    currentScore = 0;
    previousState = null;
    gameOver = false;
    recordSaved = false;
    touchStartX = null;
    touchStartY = null;

    undoButton.disabled = true;
    gameOverMessage.hidden = true;
    gameOverMessage.textContent = "Игра окончена! Больше нет доступных ходов.";

    recordForm.hidden = true;
    recordForm.reset();
    nameInput.setCustomValidity("");

    for (let index = 0; index < gameData.initialTileCount; index++) {
        addRandomTile();
    }

    renderField();
}

restartButton.addEventListener("click", function () {
    if (isAnimating) {
        return;
    }

    startGame();
});

undoButton.addEventListener("click", function () {
    if (previousState === null || gameOver || recordsDialog.open || isAnimating) {
        return;
    }

    field = previousState.field.slice();
    currentScore = previousState.score;

    previousState = null;
    undoButton.disabled = true;

    renderField();
});

recordForm.addEventListener("submit", function (event) {
    event.preventDefault();

    if (!gameOver || recordSaved || recordForm.hidden || isAnimating) {
        return;
    }

    const playerName = nameInput.value.trim();

    if (playerName === "") {
        nameInput.setCustomValidity("Введи имя, а не только пробелы.");
        nameInput.reportValidity();
        return;
    }

    const record = {
        name: playerName,
        score: currentScore,
        date: new Date().toISOString()
    };

    const nextRecords = records.slice();
    nextRecords.push(record);

    nextRecords.sort(function (a, b) {
        return b.score - a.score;
    });

    const topRecords = nextRecords.slice(0, 10);

    try {
        localStorage.setItem("2048-records", JSON.stringify(topRecords));
    } catch {
        gameOverMessage.textContent = "Не удалось сохранить результат. Попробуй ещё раз.";
        return;
    }

    records = topRecords;
    recordSaved = true;
    recordForm.hidden = true;
    gameOverMessage.textContent = "Ваш рекорд сохранён!";
    saveGame();
});

nameInput.addEventListener("input", function () {
    nameInput.setCustomValidity("");
});

recordsButton.addEventListener("click", function () {
    if (isAnimating) {
        return;
    }

    touchStartX = null;
    touchStartY = null;

    renderRecords();
    recordsDialog.showModal();
});

closeRecordsButton.addEventListener("click", function () {
    recordsDialog.close();
});

board.addEventListener("touchstart", function (event) {
    touchStartX = null;
    touchStartY = null;

    if (gameOver || recordsDialog.open || isAnimating || event.touches.length !== 1) {
        return;
    }

    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
}, { passive: true });

board.addEventListener("touchend", function (event) {
    if (touchStartX === null || touchStartY === null) {
        return;
    }

    const deltaX = event.changedTouches[0].clientX - touchStartX;
    const deltaY = event.changedTouches[0].clientY - touchStartY;

    touchStartX = null;
    touchStartY = null;

    if (gameOver || recordsDialog.open || isAnimating) {
        return;
    }

    if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 30) {
        return;
    }

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0) {
            moveHorizontal("right");
        } else {
            moveHorizontal("left");
        }
    } else {
        if (deltaY > 0) {
            moveVertical("down");
        } else {
            moveVertical("up");
        }
    }
});

board.addEventListener("touchcancel", function () {
    touchStartX = null;
    touchStartY = null;
});

document.addEventListener("keydown", function (event) {
    if (event.target === nameInput || recordsDialog.open) {
        return;
    }

    if (event.key === "ArrowLeft") {
        event.preventDefault();
        moveHorizontal("left");
    } else if (event.key === "ArrowRight") {
        event.preventDefault();
        moveHorizontal("right");
    } else if (event.key === "ArrowUp") {
        event.preventDefault();
        moveVertical("up");
    } else if (event.key === "ArrowDown") {
        event.preventDefault();
        moveVertical("down");
    }
});

window.addEventListener("resize", function () {
    if (!isAnimating) {
        renderField();
    }
});

if (!restoreGame()) {
    startGame();
}