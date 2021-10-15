import * as BABYLON from "babylonjs";
import * as GUI from "babylonjs-gui";
import {GameEvents, GameStatus} from "./game";

// 开船按钮
function createBoatLeaveButton() {
    let button = GUI.Button.CreateImageButton(
        "but",
        "Click Me",
        "textures/grass.png"
    )
    button.width = "150px"
    button.height = "40px";
    button.color = "white";
    button.cornerRadius = 20;
    button.background = "green";
    button.onPointerUpObservable.add(function() {
        alert("you did it!");
    });

    return button
}

export function createGUI({scene, gameStatus, gameEvents}: {
    scene: BABYLON.Scene,
    gameEvents: GameEvents, gameStatus: GameStatus,
}) {
    let aTex = GUI.AdvancedDynamicTexture.CreateFullscreenUI("gui", true, scene)

    let boatLeaveButton = createBoatLeaveButton()
    aTex.addControl(boatLeaveButton)
}