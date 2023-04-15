
var canvas;
var gl;
var program;

var aspect;

var mProjectionLoc, mModelViewLoc;

var matrixStack = [];
var modelView;

const VAN_ACCELARATION = 0.01;
const MAX_TURNING_ANGLE = 40;
const WHEELS_RADIUS = 0.25;
const FLOOR_CUBE_SIZE = 0.8;
const WHEELS_AXIS_DISTANCE = 1.1;
const MAX_SPEED = 0.5;

const CONTROLSMESSAGE = "Van:\n" +                                                                      
                        "AWSD for the van movement\n" +
                        "IJKL for the antenna movement\n" + 
                        "1,2,3,4,9,0 for the camera options\n" + 
                        "Space bar for special effect\n";

var time = 0;
var speed = 10;

var eye = [1,1,1];                                  //LATERAL 0,0,1         FRENTE 1,0,0        CIMA 0,1,0
var at = [0, 0, 0];
var up = [0,1,0];

var solidColorMode = 1;

var wheelRotation;
var wheelMotion;

var vanRotation;
var vanRotationRadius;
var vanXDisplacement;
var vanZDisplacement;
var vanSpeed;

var antennaElavation;
var antennaRotation;

var orthoXYValue;

// Stack related operations
function pushMatrix() {
    var m =  mat4(modelView[0], modelView[1],
           modelView[2], modelView[3]);
    matrixStack.push(m);
}
function popMatrix() {
    modelView = matrixStack.pop();
}
// Append transformations to modelView
function multMatrix(m) {
    modelView = mult(modelView, m);
}
function multTranslation(t) {
    modelView = mult(modelView, translate(t));
}
function multScale(s) { 
    modelView = mult(modelView, scalem(s)); 
}
function multRotationX(angle) {
    modelView = mult(modelView, rotateX(angle));
}
function multRotationY(angle) {
    modelView = mult(modelView, rotateY(angle));
}
function multRotationZ(angle) {
    modelView = mult(modelView, rotateZ(angle));
}

function fit_canvas_to_window()
{
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    aspect = canvas.width / canvas.height;
    gl.viewport(0, 0,canvas.width, canvas.height);

}

window.onresize = function () {
    fit_canvas_to_window();
}

/*
THIS CODE HAS BEEN DEVELOPED BY JOAO PIO
CONTACT ME AT:
jpbp.pio@gmail.com
https://www.linkedin.com/in/jpio-eng/
*/

window.onload = function() {
    canvas = document.getElementById('gl-canvas');
    gl = WebGLUtils.setupWebGL(canvas);
    if(!gl) { alert("WebGL isn't available"); }

    fit_canvas_to_window();
    gl.clearColor(0.0, 0.0, 0.0, 0.85);

    gl.enable(gl.DEPTH_TEST);

    cubeInit(gl);
    cylinderInit(gl);
    sphereInit(gl);
    torusInit(gl);
    parabolaInit(gl);
    
    program = initShaders(gl, 'default-vertex', 'default-fragment');

    gl.useProgram(program);

    vNormalLoc = gl.getUniformLocation(program, "vNormal");
    mModelViewLoc = gl.getUniformLocation(program, "mModelView");
    mProjectionLoc = gl.getUniformLocation(program, "mProjection");

    solidColorModeLoc = gl.getUniformLocation(program, "solidColorMode");
    fColorLoc = gl.getUniformLocation(program, "fColor");

    wheelRotation = 0;
    wheelMotion = 0;
    vanRotation = 0;
    vanRotationRadius = 0;
    vanXDisplacement = 0;
    vanZDisplacement = 0;
    antennaElavation = 0;
    antennaRotation = 0;
    oneColorMode = 0;
    vanSpeed = 0;

    orthoXYValue = 3;

    setupCameraControls();
    vanControls();
    render();
}

function setupCameraControls() {
    document.onkeypress = function(e) {
      switch (e.key) {
        case "1":
            eye = [0,1,0];
            up = [0,0,-1];
            orthoXYValue = 2;
        break;
        case "2":
            eye = [0,0,1];
            up = [0,1,0];
            orthoXYValue = 2;
        break;
        case "3":
            eye = [1,0,0];
            up = [0,1,0];
            orthoXYValue = 2;
        break;
        case "9":
            eye = [0,1,0];
            up = [0,0,-1];
            orthoXYValue = 10;
        break;
        case "0":
            eye = [1,1,1];
            up = [0,1,0];
            orthoXYValue = 3;
        break;
      }
    };
}

function vanControls(){
    document.onkeydown= function(e) {
        switch(e.key){
            case "a":
            case "A":
                    if(wheelRotation > -MAX_TURNING_ANGLE)
                        wheelRotation -= 4;
            break;
            case "d":
            case "D":
                    if(wheelRotation < MAX_TURNING_ANGLE)
                        wheelRotation+=4;
            break;
            case "w":
            case "W":
                    vanSpeed+=VAN_ACCELARATION;
            break;
            case "s":
            case "S":
                    vanSpeed-=VAN_ACCELARATION; 
            break;
            case "i":
            case "I":
                    if(antennaElavation < 170)
                        antennaElavation+=4;
            break;
            case "k":
            case "K":
                    if(antennaElavation > 0)
                        antennaElavation-=4;
            break;
            case "j":
            case "J":
                    antennaRotation+=3;
            break;
            case "l":
            case "L":
                    antennaRotation-=3;
            break;
            case " ":
                    solidColorMode = !solidColorMode;
            break;
        }
    }
}

function render(){
    requestAnimationFrame(render);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var projection = ortho(-orthoXYValue * aspect, orthoXYValue* aspect,-orthoXYValue,orthoXYValue,-20,20);
    
    gl.uniformMatrix4fv(mProjectionLoc, false, flatten(projection));

    modelView = lookAt(eye, at, up);

    gl.uniform1f(solidColorModeLoc, solidColorMode);

    if(vanSpeed > MAX_SPEED)
        vanSpeed = MAX_SPEED;
    
    if(vanSpeed < -MAX_SPEED)
        vanSpeed = -MAX_SPEED;


    vanRotation += wheelRotation * vanSpeed;

    var prevX = vanXDisplacement;
    var prevZ = vanZDisplacement;
    
    vanXDisplacement += vanSpeed*Math.cos(vanRotation*Math.PI/180);
    vanZDisplacement += vanSpeed*Math.sin(vanRotation*Math.PI/180);

    if(vanSpeed > 0)
        wheelMotion += Math.sqrt(Math.pow(vanXDisplacement - prevX, 2) + Math.pow(vanZDisplacement - prevZ, 2));
    else
        wheelMotion -= Math.sqrt(Math.pow(vanXDisplacement - prevX, 2) + Math.pow(vanZDisplacement - prevZ, 2));    
    
    floor();
    radioVan();
}

function floor(){

    gl.uniform4fv(fColorLoc, [0.39, 0.26, 0.12, 1.0]);

    for(i = 0; i < 30; i++){
        for(j = 0; j < 14; j++){
            pushMatrix();
                multScale([FLOOR_CUBE_SIZE,2,FLOOR_CUBE_SIZE]);
                pushMatrix();
                    multTranslation([i,-1.0,j]);
                    gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
                    cubeDrawWireFrame(gl,program);
                popMatrix();
                pushMatrix();
                    multTranslation([-i,-1.0,-j]);
                    gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
                    cubeDrawWireFrame(gl,program);
                popMatrix();
                pushMatrix();
                    multTranslation([i,-1.0,-j]);
                    gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
                    cubeDrawWireFrame(gl,program);
                popMatrix();
                    multTranslation([-i,-1.0,j]);
                    gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
                    cubeDrawWireFrame(gl,program);
            popMatrix();
        }
    }
}

function radioVan(){
        multTranslation([vanXDisplacement, -0.21 , vanZDisplacement]);
        multTranslation([-0.7, 0.0, 0.0]);
        multRotationY(-vanRotation);
        multTranslation([0.7, 0.0, 0.0]);
    pushMatrix();
        multRotationX(90);
        multTranslation([-0.70, -0.5, 0.50]);
        vanWheels();
    popMatrix();
    pushMatrix();
        gl.uniform4fv(fColorLoc, [1.0, 0.0, 0.0, 1.0]);
        vanBody();
    popMatrix();
        gl.uniform4fv(fColorLoc, [0.5, 0.5, 0.5, 1.0]);
        vanAntenna();
}

function vanAntenna(){
    
    multTranslation([-0.25, 0.65, 0.0]);
    
    pushMatrix();                                   //MOVER
        multRotationY(antennaRotation);
        multTranslation([0.0, 0.16 , 0.0]);
        multRotationZ(antennaElavation);
        multTranslation([0.0, -0.16 , 0.0])
        multTranslation([0.30, 0.16, 0.0]);
        multScale([0.7, 0.1, 0.1]);
        multRotationZ(-90);
        gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
        cylinderDraw(gl, program);
    popMatrix();
    pushMatrix();                                   //COLADO NA CARRINHA
        multScale([0.1, 0.3, 0.1]);
        gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
        cylinderDraw(gl, program);
    popMatrix();
    pushMatrix();                                   //AGARRADO A PARABOLICA
        multRotationY(antennaRotation);
        multTranslation([0.0, 0.165, 0.0]);
        multRotationZ(antennaElavation);
        multTranslation([0.0, -0.165, 0.0]);
        multTranslation([0.65, 0.165, 0.0]);
        multScale([0.1,0.2,0.1])
        gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
        cylinderDraw(gl, program);
    popMatrix();
    pushMatrix();
        multScale([0.15, 0.15, 0.15]);              //ESFERA
        multTranslation([0.0, 1.05, 0.0]);
        multRotationY(antennaRotation);
        multRotationZ(antennaElavation);
        gl.uniform4fv(fColorLoc, [0.2, 0.2, 0.2, 1.0]);
        gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
        sphereDraw(gl, program);
    popMatrix();
        multRotationY(antennaRotation);             //PARABOLICA
        multTranslation([0.0, 0.165, 0.0]);          
        multRotationZ(antennaElavation);
        multTranslation([0.0,-0.165, 0.0]);
        multTranslation([0.65, 0.27, 0.0]);
        multScale([0.8, 0.8, 0.8]);
        gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
        parabolaDrawWireFrame(gl, program);
}

function vanWheel(){
        multRotationY(-360*wheelMotion/(2*Math.PI*WHEELS_RADIUS));
    pushMatrix();
        multScale([WHEELS_RADIUS,0.1,WHEELS_RADIUS]);
        gl.uniform4fv(fColorLoc, [0.75, 0.75, 0.75, 1.0]);
        gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
        cylinderDraw(gl, program);
    popMatrix();
        gl.uniform4fv(fColorLoc, [0.0, 0.0, 0.0, 1.0]);
        multScale([0.4, 0.5, 0.4]);
        gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
        torusDraw(gl, program);
}

function vanWheels(){
    
    pushMatrix();                               //FRENTE DIREITA
        multTranslation([WHEELS_AXIS_DISTANCE, 0.0, 0.0]);
        multRotationZ(wheelRotation);
        vanWheel();
    popMatrix();
    pushMatrix();                               //FRENTE ESQUERDA
        multTranslation([WHEELS_AXIS_DISTANCE,1.0,0.0]);
        multRotationZ(wheelRotation);
        vanWheel();
    popMatrix();
    pushMatrix();
        multTranslation([0.0, 1.0, 0.0]);
        vanWheel();
    popMatrix();
        vanWheel();
}

function vanBody(){
    pushMatrix();
        multTranslation([-.25, 0.0, 0.0]);
        multScale([1.5,1.0,1.0]);
        gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
        cubeDrawWireFrame(gl,program);
    popMatrix();
    pushMatrix();
        multScale([0.3,0.5,1.0]);
        multTranslation([2.17, -0.5, 0.0]);
        gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
        cubeDrawWireFrame(gl,program);
    popMatrix();
    pushMatrix();           //JANELAS
        multTranslation([0.25, 0.25, 0.5]);
        multScale([0.4,0.4,0.0]);
        gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
        cubeDrawWireFrame(gl,program);
    popMatrix();
    pushMatrix();           
        multTranslation([0.25, 0.25, -0.5]);
        multScale([0.4,0.4,0.0]);
        gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
        cubeDrawWireFrame(gl,program);
    popMatrix();
    pushMatrix();
        multTranslation([0.5, 0.25, 0.0]);
        multScale([0.0,0.4,0.9]);
        gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
        cubeDrawWireFrame(gl,program);
    popMatrix();
    pushMatrix()            //PORTAS
        multTranslation([0.25, 0.0, 0.5]);
        multScale([0.5,1.0,0.0]);
        gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
        cubeDrawWireFrame(gl,program);
    popMatrix();
    pushMatrix()            
        multTranslation([0.25, 0.0, -0.5]);
        multScale([0.5,1.0,0.0]);
        gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
        cubeDrawWireFrame(gl,program);
    popMatrix();
    pushMatrix()            //PORTAS TRASEIRAS
        multTranslation([-1.0, 0.0, 0.25]);
        multScale([0.0,1.0,0.5]);
        gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
        cubeDrawWireFrame(gl,program);
    popMatrix();
    pushMatrix()            //PUXADORES
        multTranslation([0.10, -0.05, 0.5]);
        multScale([0.1,0.05,0.0]);
        gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
        cubeDrawWireFrame(gl,program);
    popMatrix();
    pushMatrix()            //PUXADORES
        multTranslation([0.10, -0.05, -0.5]);
        multScale([0.1,0.05,0.0]);
        gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
        cubeDrawWireFrame(gl,program);
    popMatrix();
    pushMatrix()            //PUXADORES
        multTranslation([-1.0, -0.05, 0.0]);
        multScale([0.0,0.1,0.05]);
        gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
        cubeDrawWireFrame(gl,program);
    popMatrix();
    pushMatrix()           //FAROIS
        multTranslation([0.725, -0.15, 0.35]);
        gl.uniform4fv(fColorLoc, [1.0, 1.0, 0.0, 1.0]);
        multRotationZ(-90);
        multScale([0.2, 0.3, 0.2])
        gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
        parabolaDrawWireFrame(gl,program);
        multTranslation([0.0, 0.0, -3.5]);
        gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
        parabolaDrawWireFrame(gl,program);
    popMatrix();
        gl.uniform4fv(fColorLoc, [0.5, 0.5, 0.5, 1.0]);             //EIXOS
        multTranslation([-0.70, -0.5, 0.0]);
        multScale([0.1, 0.1, 1.0]);
        multRotationX(90);
        gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
        cylinderDraw(gl, program);
        multTranslation([11.0, 0.0, 0.0]);
        gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
        cylinderDraw(gl, program);
}

function showControls(){
    alert(CONTROLSMESSAGE);
}