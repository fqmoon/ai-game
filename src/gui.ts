import * as BABYLON from "babylonjs";
import * as GUI from "babylonjs-gui";

// 开船按钮
function createBoatLeaveButton() {

}

function createGUI() {
    let button = GUI.Button.CreateImageButton(
        "but",
        "Click Me",
        "textures/grass.png"
    )

    return button
}