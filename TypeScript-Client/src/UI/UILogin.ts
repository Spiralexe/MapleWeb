import WZManager from "../wz-utils/WZManager";
import UICommon from "./UICommon";
import MapleInput from "./MapleInput";
import Random from "../Random";
import { MapleStanceButton } from "./MapleStanceButton";
import ClickManager from "./ClickManager";
import MapleFrameButton from "./MapleFrameButton";
import GameCanvas from "../GameCanvas";

interface UILoginInterface {
  frameImg: any;
  inputUsn: MapleInput | null;
  inputPwd: MapleInput | null;
  newCharStats: number[];
  initialize: (canvas: GameCanvas) => Promise<void>;
  doUpdate: (msPerTick: number, camera: any, canvas: GameCanvas) => void;
  doRender: (
    canvas: GameCanvas,
    camera: any,
    lag: number,
    msPerTick: number,
    tdelta: number
  ) => void;
  removeInputs: () => void;
  moveToChannelSelect: (camera: any) => void;
  isTransitioningToChannel: boolean;
  cameraTargetX: number;
  cameraTargetY: number;
  cameraTransitionCallback: (() => void) | null;
  worldSelectSign: MapleWorldSelect | null;
}

const UILogin = {} as UILoginInterface;

UILogin.initialize = async function (canvas: GameCanvas) {
  await UICommon.initialize();
  const uiLogin: any = await WZManager.get("UI.wz/Login.img");

  this.frameImg = uiLogin.Common.frame.nGetImage();

  this.inputUsn = new MapleInput(canvas, {
    x: 442,
    y: 236,
    width: 142,
    height: 20,
    color: "#ffffff",
  });
  this.inputPwd = new MapleInput(canvas, {
    x: 442,
    y: 265,
    width: 142,
    height: 20,
    color: "#ffffff",
    type: "password",
  });

  const loginButton = new MapleStanceButton(canvas, {
    x: 223,
    y: -85,
    img: uiLogin.Title.BtLogin.nChildren,
    onClick: () => {
      console.log("login!");
      // Move camera to channel selection after login button click
      this.moveToChannelSelect(canvas.camera);
    },
  });
  ClickManager.addButton(loginButton);

  const scaniaSign = new MapleStanceButton(canvas, {
    x: -168,
    y: -800,
    img: uiLogin.WorldSelect.BtWorld[0].nChildren,
    onClick: () => {
      console.log("Scania selected!");
    },
  });

  ClickManager.addButton(scaniaSign);

  // TODO: for now only scania is enabled
  // Can enable all the worlds after the rest of the logic is working

  //const beriaSign = new MapleStanceButton(canvas, {
  //  x: -140,
  //  y: -800,
  //  img: uiLogin.WorldSelect.BtWorld[1].nChildren,
  //  onClick: () => {
  //    console.log("Beria selected!");
  //  },
  //});
  //ClickManager.addButton(beriaSign);

  const dice = new MapleFrameButton({
    x: 245,
    y: -1835,
    img: uiLogin.NewChar.dice.nChildren,
    onEndFrame: () => {
      this.newCharStats = Random.generateDiceRollStats();
      console.log("Random stats: ", this.newCharStats);
    },
    hoverAudio: false,
  });
  ClickManager.addButton(dice);

  this.newCharStats = Random.generateDiceRollStats();
  
  // Initialize camera transition variables
  this.isTransitioningToChannel = false;
  this.cameraTargetX = 0;
  this.cameraTargetY = 0;
  this.cameraTransitionCallback = null;
  this.worldSelectSign = null;
};

UILogin.moveToChannelSelect = function(camera) {
  // Set the target coordinates for the channel selection screen
  this.cameraTargetX = -372;
  this.cameraTargetY = -900;
  
  this.isTransitioningToChannel = true;
  
  // Remove login inputs when transitioning
  this.removeInputs();
  
  this.cameraTransitionCallback = async () => {
    console.log("Arrived at world selection screen");
  };
};

UILogin.doUpdate = function (msPerTick, camera, canvas) {
  UICommon.doUpdate(msPerTick);
  
  // Handle camera transition animation with improved smoothing
  if (this.isTransitioningToChannel) {
    const dx = this.cameraTargetX - camera.x;
    const dy = this.cameraTargetY - camera.y;
    
    // Fixed: Use a threshold approach to prevent shaking
    const threshold = 1.0; // Stopping threshold
    
    if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
      // Use a fixed percentage of the remaining distance for smooth deceleration
      const moveFactorX = 0.12; // Adjust these values for speed/smoothness
      const moveFactorY = 0.12;
      
      camera.x += dx * moveFactorX;
      camera.y += dy * moveFactorY;
    } else {
      // Snap to exact position when close enough
      camera.x = this.cameraTargetX;
      camera.y = this.cameraTargetY;
      this.isTransitioningToChannel = false;
      
      if (this.cameraTransitionCallback) {
        this.cameraTransitionCallback();
        this.cameraTransitionCallback = null;
      }
    }
  }
  
  // Update world select sign if it exists
  if (this.worldSelectSign) {
    this.worldSelectSign.update(msPerTick);
  }
};

UILogin.doRender = function (canvas, camera, lag, msPerTick, tdelta) {
  // Draw the frame image with original implementation
  canvas.drawImage({
    img: this.frameImg,
    dx: 0,
    dy: 0,
  });

  canvas.drawText({
    text: "Ver. 0.83",
    fontWeight: "bold",
    x: 595,
    y: 13,
  });

  // If at channel selection screen, render the world select sign
  if (Math.abs(camera.x - this.cameraTargetX) < 1 && 
      Math.abs(camera.y - this.cameraTargetY) < 1 &&
      this.worldSelectSign) {
    
    this.worldSelectSign.render(canvas, camera, lag, msPerTick, tdelta);
  }

  UICommon.doRender(canvas, camera, lag, msPerTick, tdelta);
};

UILogin.removeInputs = function () {
  if (this.inputUsn) this.inputUsn.remove();
  if (this.inputPwd) this.inputPwd.remove();
  this.inputUsn = null;
  this.inputPwd = null;
};

export default UILogin;