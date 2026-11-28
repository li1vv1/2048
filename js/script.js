let field = Array(gameData.size * gameData.size).fill(0);
let currentScore = 0;
let previousState = null;
let gameOver = false;
let recordSaved = false;
let records = loadRecords();
let touchStartX = null;
let touchStartY = null;
let isAnimating = false;

const main = document.createElement("main");
main.className = "game";
document.body.append(main);

const svgNamespace = "http://www.w3.org/2000/svg";

const garland = document.createElementNS(svgNamespace, "svg");
garland.classList.add("game__garland");
garland.setAttribute("aria-hidden", "true");
garland.setAttribute("focusable", "false");
main.append(garland);

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

const gameOverPanel = document.createElement("section");
gameOverPanel.className = "game__over";
gameOverPanel.hidden = true;
gameOverPanel.setAttribute("aria-label", "Игра окончена");
main.append(gameOverPanel);

const gameOverMessage = document.createElement("p");
gameOverMessage.textContent = "Игра окончена! Больше нет доступных ходов.";
gameOverMessage.className = "game__message";
gameOverPanel.append(gameOverMessage);

const recordForm = document.createElement("form");
recordForm.className = "record-form";
recordForm.hidden = true;
gameOverPanel.append(recordForm);

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

function renderGarland() {
    const width = main.offsetWidth + 44;
    const height = main.offsetHeight + 44;

    garland.setAttribute("viewBox", "0 0 " + width + " " + height);
    garland.replaceChildren();

    let pathData = "M 32 14";

    function addSide(startX, startY, endX, endY) {
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        const length = Math.hypot(deltaX, deltaY);
        const count = Math.max(1, Math.round(length / 100));

        const directionX = deltaX / length;
        const directionY = deltaY / length;

        const normalX = directionY;
        const normalY = -directionX;
        const step = length / count;

        function point(distance, offset) {
            const x = startX + directionX * distance + normalX * offset;
            const y = startY + directionY * distance + normalY * offset;

            return x + " " + y;
        }

        for (let index = 0; index < count; index++) {
            const start = index * step;

            pathData += " C " +
                point(start + step * 0.25, 9) + " " +
                point(start + step * 0.65, 9) + " " +
                point(start + step * 0.65, 0);

            pathData += " C " +
                point(start + step * 0.65, -9) + " " +
                point(start + step * 0.35, -9) + " " +
                point(start + step * 0.35, 0);

            pathData += " C " +
                point(start + step * 0.35, 6) + " " +
                point(start + step * 0.8, 6) + " " +
                point(start + step, 0);
        }
    }

    addSide(32, 14, width - 32, 14);

    pathData += " Q " + (width - 14) + " 14 " +
        (width - 14) + " 32";

    addSide(width - 14, 32, width - 14, height - 32);

    pathData += " Q " + (width - 14) + " " + (height - 14) +
        " " + (width - 32) + " " + (height - 14);

    addSide(width - 32, height - 14, 32, height - 14);

    pathData += " Q 14 " + (height - 14) + " 14 " + (height - 32);

    addSide(14, height - 32, 14, 32);

    pathData += " Q 14 14 32 14 Z";

    const wire = document.createElementNS(svgNamespace, "path");
    wire.classList.add("game__wire");
    wire.setAttribute("d", pathData);
    garland.append(wire);

    const pathLength = wire.getTotalLength();
    const bulbCount = Math.max(12, Math.round(pathLength / 65));

    for (let index = 0; index < bulbCount; index++) {
        const distance = (index + 0.5) * pathLength / bulbCount;
        const point = wire.getPointAtLength(distance);
        const nextPoint = wire.getPointAtLength(distance + 1);

        const angle = Math.atan2(
            nextPoint.y - point.y,
            nextPoint.x - point.x
        ) * 180 / Math.PI;

        const bulbGroup = document.createElementNS(svgNamespace, "g");
        bulbGroup.setAttribute(
            "transform",
            "translate(" + point.x + " " + point.y + ") rotate(" +
            (angle + 180) + ")"
        );

        const bulb = document.createElementNS(svgNamespace, "ellipse");
        bulb.classList.add("game__bulb");
        bulb.classList.add("game__bulb--" + index % 4);
        bulb.setAttribute("cx", "0");
        bulb.setAttribute("cy", "7");
        bulb.setAttribute("rx", "4");
        bulb.setAttribute("ry", "6");
        bulb.style.animationDelay = -(index % 7) * 0.4 + "s";

        const socket = document.createElementNS(svgNamespace, "rect");
        socket.classList.add("game__socket");
        socket.setAttribute("x", "-2.5");
        socket.setAttribute("y", "-1");
        socket.setAttribute("width", "5");
        socket.setAttribute("height", "4");
        socket.setAttribute("rx", "1");

        bulbGroup.append(bulb, socket);
        garland.append(bulbGroup);
    }
}

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

function loadRecords() {
    try {
        const savedRecords = JSON.parse(
            localStorage.getItem(gameData.recordsKey)
        );

        if (!Array.isArray(savedRecords)) {
            return [];
        }

        return savedRecords.filter(function (record) {
            return record && typeof record.name === "string" &&
                record.name.trim().length > 0 && record.name.length <= 30 &&
                Number.isSafeInteger(record.score) && record.score >= 0 &&
                typeof record.date === "string" &&
                Number.isFinite(Date.parse(record.date));
        }).sort(function (a, b) {
            return b.score - a.score;
        }).slice(0, gameData.recordsLimit);
    } catch {
        return [];
    }
}

function saveGame() {
    const state = {
        field: field,
        score: currentScore,
        previousState: previousState,
        recordSaved: recordSaved
    };

    try {
        localStorage.setItem(gameData.sessionKey, JSON.stringify(state));
    } catch (error) {
        console.error("Не удалось сохранить игру:", error);
    }
}

function renderGameStatus() {
    restartButton.disabled = isAnimating;
    recordsButton.disabled = isAnimating;
    undoButton.disabled = isAnimating || gameOver || previousState === null;
    saveRecordButton.disabled = isAnimating || recordSaved;

    gameOverPanel.hidden = !gameOver || isAnimating;
    recordForm.hidden = !gameOver || recordSaved;

    gameOverMessage.textContent = recordSaved ?
        "Ваш рекорд сохранён!" :
        "Игра окончена! Больше нет доступных ходов.";
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
    let points = 0;

    while (index < tiles.length - 1) {
        if (tiles[index].value === tiles[index + 1].value) {
            tiles[index].value = tiles[index].value * 2;
            points = points + tiles[index].value;

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
        movements: movements,
        points: points
    };
}

async function animateMove(movements, nextField, stateBeforeMove, points) {
    isAnimating = true;
    touchStartX = null;
    touchStartY = null;

    previousState = stateBeforeMove;
    field = nextField;
    currentScore = currentScore + points;

    addRandomTile();
    gameOver = isGameOver();

    if (gameOver) {
        previousState = null;
    }

    renderGameStatus();
    saveGame();

    const boardWidth = board.offsetWidth;
    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    try {
        if (!reducedMotion) {
            const animations = [];

            movements.forEach(function (movement) {
                const tile = tilesLayer.querySelector(
                    "[data-index='" + movement.from + "']"
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
                        transform: "translate(" +
                            deltaX + "px, " + deltaY + "px)"
                    }
                ], {
                    duration: gameData.moveDuration,
                    easing: "ease-in-out",
                    fill: "forwards"
                });

                animations.push(animation.finished);
            });

            await Promise.allSettled(animations);
        }

        renderField();

        if (!reducedMotion) {
            const mergedCells = [];
            const animations = [];

            movements.forEach(function (movement) {
                if (movement.merged && !mergedCells.includes(movement.to)) {
                    mergedCells.push(movement.to);
                }
            });

            mergedCells.forEach(function (index) {
                const tile = tilesLayer.querySelector(
                    "[data-index='" + index + "']"
                );

                if (tile) {
                    const animation = tile.animate([
                        { transform: "scale(1)" },
                        { transform: "scale(1.12)" },
                        { transform: "scale(1)" }
                    ], {
                        duration: gameData.mergeDuration,
                        easing: "ease-out"
                    });

                    animations.push(animation.finished);
                }
            });

            await Promise.allSettled(animations);
        }
    } catch (error) {
        console.error("Не удалось воспроизвести анимацию:", error);
        renderField();
    } finally {
        isAnimating = false;
        renderGameStatus();

        if (board.offsetWidth !== boardWidth) {
            renderField();
        }
    }
}

function move(direction) {
    if (gameOver || recordsDialog.open || isAnimating) {
        return;
    }

    const stateBeforeMove = {
        field: field.slice(),
        score: currentScore
    };

    const vertical = direction === "up" || direction === "down";
    const reverse = direction === "right" || direction === "down";

    const nextField = field.slice();
    const movements = [];
    let points = 0;

    for (let lineIndex = 0; lineIndex < gameData.size; lineIndex++) {
        const positions = [];

        for (let offset = 0; offset < gameData.size; offset++) {
            if (vertical) {
                positions.push(offset * gameData.size + lineIndex);
            } else {
                positions.push(lineIndex * gameData.size + offset);
            }
        }

        if (reverse) {
            positions.reverse();
        }

        const line = positions.map(function (index) {
            return field[index];
        });

        const result = moveLine(line);
        points = points + result.points;

        positions.forEach(function (index, offset) {
            nextField[index] = result.values[offset];
        });

        result.movements.forEach(function (movement) {
            movements.push({
                from: positions[movement.from],
                to: positions[movement.to],
                merged: movement.merged
            });
        });
    }

    const changed = field.some(function (value, index) {
        return value !== nextField[index];
    });

    if (!changed) {
        return;
    }

    return animateMove(movements, nextField, stateBeforeMove, points);
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

    const hasTiles = state.field.some(function (value) {
        return value !== 0;
    });

    const validCells = state.field.every(function (value) {
        if (!Number.isSafeInteger(value) || value < 0 || value === 1) {
            return false;
        }

        if (value === 0) {
            return true;
        }

        let remaining = value;

        while (remaining % 2 === 0) {
            remaining = remaining / 2;
        }

        return remaining === 1;
    });

    return hasTiles && validCells &&
        Number.isSafeInteger(state.score) &&
        state.score >= 0;
}

function restoreGame() {
    let state;

    try {
        state = JSON.parse(localStorage.getItem(gameData.sessionKey));
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

    renderGameStatus();
    renderField();
    saveGame();

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

    recordForm.reset();
    nameInput.setCustomValidity("");
    renderGameStatus();

    for (let index = 0; index < gameData.initialTileCount; index++) {
        addRandomTile();
    }

    renderField();
    saveGame();
}

function restartGame() {
    if (isAnimating) {
        return;
    }

    startGame();
}

restartButton.addEventListener("click", restartGame);

undoButton.addEventListener("click", function () {
    if (previousState === null || gameOver || recordsDialog.open || isAnimating) {
        return;
    }

    field = previousState.field.slice();
    currentScore = previousState.score;

    previousState = null;

    renderGameStatus();
    renderField();
    saveGame();
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

    const topRecords = nextRecords.slice(0, gameData.recordsLimit);

    try {
        localStorage.setItem(
            gameData.recordsKey,
            JSON.stringify(topRecords)
        );
    } catch {
        gameOverMessage.textContent =
            "Не удалось сохранить результат. Попробуй ещё раз.";
        return;
    }

    records = topRecords;
    recordSaved = true;

    renderGameStatus();
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

    if (gameOver || recordsDialog.open ||
        isAnimating || event.touches.length !== 1) {
        return;
    }

    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
}, { passive: true });

board.addEventListener("touchend", function (event) {
    if (touchStartX === null || touchStartY === null ||
        event.touches.length !== 0 || event.changedTouches.length !== 1) {
        touchStartX = null;
        touchStartY = null;
        return;
    }

    const deltaX = event.changedTouches[0].clientX - touchStartX;
    const deltaY = event.changedTouches[0].clientY - touchStartY;

    touchStartX = null;
    touchStartY = null;

    if (gameOver || recordsDialog.open || isAnimating) {
        return;
    }

    if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < gameData.swipeThreshold) {
        return;
    }

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0) {
            move("right");
        } else {
            move("left");
        }
    } else {
        if (deltaY > 0) {
            move("down");
        } else {
            move("up");
        }
    }
});

board.addEventListener("touchcancel", function () {
    touchStartX = null;
    touchStartY = null;
});

document.addEventListener("keydown", function (event) {
    if (event.target === nameInput || recordsDialog.open ||
        event.ctrlKey || event.altKey || event.metaKey) {
        return;
    }

    const direction = gameData.keyDirections[event.key];

    if (typeof direction === "string") {
        event.preventDefault();
        move(direction);
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

const garlandObserver = new ResizeObserver(function () {
    renderGarland();
});

garlandObserver.observe(main);