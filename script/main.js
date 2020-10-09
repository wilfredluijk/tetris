//Globals
let stagingType = 0;
let score = 0;
let lines = 0;
let level = 1;
let activeBlock = {
    type: -1,
    coords: [[{x: 0, y: 0}]]
};
let pause = false;
let timeout = 1000;

const gameScreen = [];
const previewScreen = []

//Entry Point
main();

function main() {
    window.onload = () => {
        initializeGameScreen();
        document.querySelector("#pause")
            .addEventListener("click", pauseGame);
        document.querySelector("#restart")
            .addEventListener("click", loseGame);
    }
    document.onkeydown = handleArrowKeys;

    runGameTimer();
}

function runGameTimer() {
    setTimeout(() => {
        console.log('gameloop', timeout);
        gameLoop();
        runGameTimer()
    }, timeout);

    let speed = 1000;
    for (let i = 1; i <= level; i++) {
        speed *= 0.9;
    }
    timeout = timeout > speed ? speed : timeout;
}

function clearStagingScreen() {
    previewScreen.forEach(row => row.forEach(block => block.filled = 0));
}

function setStagingScreen() {
    const startCoords = getStartCoordsForType(stagingType);
    startCoords.forEach(row => row.forEach(block => previewScreen[block.y + 4][block.x - 4].filled = stagingType));
}

function renderPreviewScreen() {
    previewScreen.forEach(row => {
        row.forEach(block => {
            block.div.className = 'tetris-block filled-' + block.filled
        })
    })
}

function gameLoop() {
    if (!pause) {
        if (stagingType === 0) {
            clearStagingScreen();
            stagingType = Math.floor(Math.random() * 7) + 1;
            console.log(stagingType);
            setStagingScreen();
            renderPreviewScreen();
        }

        if (activeBlock.type === -1) {
            scoreForCompleteRows();
            initiateNewGameBlock();
            stagingType = 0;
        }

        moveDown();
        renderScreen();

    }
}

function handleArrowKeys(e) {
    if (!pause) {
        switch (e.key) {
            case "ArrowLeft":
                moveSideways(-1);
                renderScreen();
                break;
            case "ArrowRight":
                moveSideways(1);
                renderScreen();
                break;
            case "ArrowUp":
                rotate();
                renderScreen();
                break;
            case "ArrowDown":
                moveDown();
                renderScreen();
                break;
        }
    }
}


function pauseGame() {
    pause = !pause;
    const element = document.querySelector('#pause');
    let text = 'pause';
    if (pause) {
        text = 'resume'
    }
    element.innerHTML = text;
}

function getLevel() {
    let gameLevel = 1;
    if (lines > 10) {
        gameLevel = Math.round(lines / 10) + 1;
    }
    return gameLevel;
}

function setScoreAndLevel() {
    const scoreElement = document.querySelector('#score-field');
    scoreElement.innerHTML = String(score);
    const linesElement = document.querySelector('#level-field');
    linesElement.innerHTML = String(level);
}

function scoreForCompleteRows() {
    const gameScreenDiv = document.querySelector('.tetris-view');

    let scoreCount = 0;
    gameScreen.forEach((row, index) => {
        const complete = row.every(el => el.filled > 0);
        if (complete) {
            scoreCount++;
            const rowObject = getNewRow(10);
            const parent = row[0].div.parentNode;
            parent.parentNode.removeChild(row[0].div.parentElement);
            gameScreen.splice(index, 1);
            gameScreen.splice(0, 0, rowObject.blocks);
            gameScreenDiv.insertBefore(rowObject.rowDiv, gameScreenDiv.children[0]);
        }
    });

    if (scoreCount > 0) {
        level = getLevel()
        switch (scoreCount) {
            case 1:
                score += (level * 100);
                break;
            case 2:
                score += (level * 200);
                break
            case 3:
                score += (level * 500);
                break;
            case 4:
                score += (level * 800);
                break;
        }
        lines += scoreCount
        setScoreAndLevel();
    }
}

function renderScreen() {
    gameScreen.forEach(row => {
        row.forEach(block => {
            block.div.className = 'tetris-block filled-' + block.filled
        })
    })
}

function initializeGameScreen() {
    const gameScreenDiv = document.querySelector('.tetris-view');
    Array.from(Array(20).keys()).forEach((val, index) => {
        const {rowDiv, blocks} = getNewRow(10);
        gameScreenDiv.appendChild(rowDiv);
        gameScreen.push(blocks);
    });

    const previewScreenDiv = document.querySelector('.preview-box');
    Array.from(Array(4).keys()).forEach((val, index) => {
        const {rowDiv, blocks} = getNewRow(4);
        previewScreenDiv.appendChild(rowDiv);
        previewScreen.push(blocks);
    });
}

function getNewRow(length) {
    const rowDiv = createDivWithClass('tetris-row');
    const blocks = [];
    Array.from(Array(length).keys()).forEach((block, index) => {
        const blockDiv = createDivWithClass('tetris-block');
        rowDiv.appendChild(blockDiv);
        blocks.push({filled: 0, div: blockDiv});
    });
    return {rowDiv, blocks};
}

function createDivWithClass(className) {
    const rowDiv = document.createElement('div');
    rowDiv.className = className;
    return rowDiv;
}

function moveSideways(horizontalStep) {
    const coords = activeBlock.coords;

    if (canMoveSideways(coords, horizontalStep) && activeBlockIsNotReset()) {
        coords.forEach(row => {
            row.forEach(block => {
                if (block.y >= 0) {
                    if (blocksOnPos(block) <= 1) {
                        gameScreen[block.y][block.x].filled = 0;
                    }
                    block.x += horizontalStep;
                    gameScreen[block.y][block.x].filled = activeBlock.type;
                } else {
                    block.x += horizontalStep;
                }
            })
        })
    }
}

function canMoveSideways(coords, horizontalStep) {
    let canMove = true;
    rowLoop: for (let figureRow of coords) {
        for (let block of figureRow) {
            const newX = block.x + horizontalStep;
            if (newX > 9 || newX < 0) {
                canMove = false;
                break rowLoop;
            }
            if (block.y >= 0) {
                const gameScreenBlock = gameScreen[block.y][newX];
                const isOwn = anyMatch(compareBlock => compareBlock.x === newX
                    && compareBlock.y === block.y);

                if (gameScreenBlock.filled > 0 && !isOwn) {
                    canMove = false;
                    break rowLoop;
                }
            }
        }
    }
    return canMove;
}

function activeBlockIsNotReset() {
    return activeBlock.type !== -1;
}

function anyMatch(booleanCallback) {
    return activeBlock.coords.some(row => row.some(block => booleanCallback(block)));
}

function rotate() {
    const maxY = Math.max(...activeBlock.coords.flatMap(row => row.map(block => block.y)));
    const minX = Math.min(...activeBlock.coords.flatMap(row => row.map(block => block.x)));
    let canTurn = true;


    activeBlock.coords.forEach(row => row.forEach(block => {
        if (canTurn) {
            const xOld = block.x;
            const yOld = block.y;
            const yNew = xOld + (maxY - minX);
            const xNew = minX + (maxY - yOld);
            if (minX >= 0 && yNew < gameScreen.length && xNew <= 9) {
                const blockElement = gameScreen[yNew][xNew];
                if (!anyMatch(gameBlock => gameBlock.x === xNew && gameBlock.y === yNew)) {
                    canTurn = blockElement.filled !== 1
                }
            } else {
                canTurn = false;
            }
        }
    }))

    if (canTurn) {
        activeBlock.coords.forEach(row => row.forEach(block => {
            const xOld = block.x;
            const yOld = block.y;

            const yNew = xOld + (maxY - minX);
            const xNew = minX + (maxY - yOld);

            if (yOld >= 0 && blocksOnPos(block) <= 1) {
                gameScreen[yOld][xOld].filled = 0;
            }
            if (yNew >= 0) {
                gameScreen[yNew][xNew].filled = activeBlock.type;
            }
            block.x = xNew;
            block.y = yNew;
        }));
    }
}

function initiateNewGameBlock() {
    activeBlock.type = stagingType;
    activeBlock.coords = getStartCoordsForType(stagingType)
}

function resetActiveBlock() {
    activeBlock.type = -1;
}

function blocksOnPos(position) {
    let count = 0;
    activeBlock.coords.some(row => row.some(block => {
        if (block.x === position.x && block.y === position.y)
            count++;
    }));
    return count;
}

function restartGame() {
    resetActiveBlock();
    score = 0;
    level = 1;
    lines = 0;
    timeout = 1000;
    setScoreAndLevel();
    pause = false;
}

function resetGame() {
    gameScreen.slice().forEach((row, index) => {

        setTimeout(() => {
            if (index === gameScreen.length - 1) {
                restartGame();
            }
            row.forEach(block => block.filled = 0);
            renderScreen();
        }, index * 100);
    })
}

function loseGame() {
    pause = true;
    gameScreen.slice().reverse().forEach((row, index) => {

        setTimeout(() => {
            row.forEach(block => block.filled = 8);
            renderScreen();
            if (index === gameScreen.length - 1) {
                resetGame();
            }
        }, index * 100);
        console.log()
    })
}

function moveDown() {
    let invalidMove = false;
    const figureRowCount = activeBlock.coords.length - 1;
    for (let i = figureRowCount; i >= 0; i--) {
        const figureRow = activeBlock.coords[i];

        figureRow.forEach((position, index) => {
            const newY = position.y + 1;
            if (newY >= 0 && !invalidMove) {
                invalidMove = newY >= gameScreen.length;

                if (!invalidMove) {
                    const isSelf = anyMatch(block => block.x === position.x
                        && block.y === newY);
                    if (i === figureRowCount) {
                        if (!isSelf) {
                            invalidMove = gameScreen[newY][position.x].filled > 0;
                        }
                    } else {
                        const blockBelow = activeBlock.coords[i + 1]
                            .some(blockCoordinates => blockCoordinates.x === position.x
                                && blockCoordinates.y === newY);
                        if (!blockBelow) {
                            if (!isSelf) {
                                invalidMove = gameScreen[newY][position.x].filled > 0;
                            }
                        }
                    }
                }
                if (invalidMove) {
                    resetActiveBlock();
                }
            }
        });
    }

    if (!invalidMove) {
        for (let i = figureRowCount; i >= 0; i--) {
            const figureRow = activeBlock.coords[i];
            figureRow.forEach((position, index) => {
                const newY = position.y + 1;

                if (position.y >= 0 && blocksOnPos(position) <= 1) {
                    gameScreen[position.y][position.x].filled = 0
                }
                if (newY >= 0) {
                    gameScreen[newY][position.x].filled = activeBlock.type;
                }
                position.y = newY;
            });
        }
    } else {
        const lost = activeBlock.coords.flatMap(row => row.map(block => block.y)).every(yCoord => yCoord < 0);
        if (lost) {
            loseGame();
        }

    }
}

function getStartCoordsForType(stagingTypeId) {
    let returnValue = [];
    switch (stagingTypeId) {
        case 1:
            // #
            // #
            // #
            // #
            returnValue = [[{x: 5, y: -4}], [{x: 5, y: -3}], [{x: 5, y: -2}], [{x: 5, y: -1}]];
            break
        case 2:
            // #
            // #
            // ##
            returnValue = [[{x: 5, y: -3}], [{x: 5, y: -2}], [{x: 5, y: -1}, {x: 6, y: -1}]];
            break;
        case 3:
            //  #
            //  #
            // ##
            returnValue = [[{x: 5, y: -3}], [{x: 5, y: -2}], [{x: 4, y: -1}, {x: 5, y: -1}]]
            break;
        case 4:
            // ##
            // ##
            returnValue = [[{x: 5, y: -2}, {x: 6, y: -2}], [{x: 5, y: -1}, {x: 6, y: -1}]]
            break;
        case 5:
            // ##
            //  ##
            returnValue = [[{x: 5, y: -2}, {x: 6, y: -2}], [{x: 6, y: -1}, {x: 7, y: -1}]]
            break;
        case 6:
            //  ##
            // ##
            returnValue = [[{x: 6, y: -2}, {x: 7, y: -2}], [{x: 5, y: -1}, {x: 6, y: -1}]]
            break;
        case 7:
            // #
            // ##
            // #
            returnValue = [[{x: 5, y: -3}], [{x: 5, y: -2}, {x: 6, y: -2}], [{x: 5, y: -1}]];
            break;
    }
    return returnValue;
}
