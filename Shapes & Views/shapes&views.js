const ORTHO = "ortho";
const PERSP = "persp";
const AXONO = "axono";

const ORTHO1 = "Alçado Principal";
const ORTHO2 = "Planta";
const ORTHO3 = "Alçado Lateral Direito";

const AXONO1 = "Isometria";
const AXONO2 = "Dimetria";
const AXONO3 = "Trimetria";
const AXONO4 = "Axonometria Livre";

const PERSP1 = "Perspetiva";

const ON = "On";
const OFF = "Off";

const FILLED = "Filled";
const WIREF = "WireFrame";

const CONTROLSMESSAGE = "Projeções:\n" +                                                                      
                        "Tecla 1 - " + ORTHO1 + "                   " + "Tecla 5 - " + AXONO2 + "\n" + 
                        "Tecla 2 - " + ORTHO2 + "                                   " + "Tecla 6 - " + AXONO3 + "\n" +
                        "Tecla 3 - " + ORTHO3 + "          " + "Tecla 7 - " + AXONO4 + "\n" + 
                        "Tecla 4 - " + AXONO1 + "                              " + "Tecla 8 - " + PERSP1 + "\n" +
                        "Efeitos:\n" + 
                        "Tecla Z - zBuffer                  Tecla B - Back Face Culling\n" +
                        "Tecla W - WiredFrame         Tecla F - Filled\n" + 
                        "Tecla L - Ligar/Desligar Iluminação";

const AI = BI = 30 * Math.PI/180;

const AD = 42 * Math.PI/180;
const BD = 7 * Math.PI/180;

const AT =  (54+16/60) * Math.PI/180;
const BT = (23+16/60) * Math.PI/180;

const CANVASWIDTHSUBTRACTOR = 20;
const CANVASHEIGHTSUBTRACTORWITHLIGHT = 210;
const CANVASHEIGHTSUBTRACTORWITHOUTLIGHT = 100;

var gl;
var canvas;

var zoomValue;

var mProjection;
var projectionType;
var draggableProjection;
var xAxisDrag;
var yAxisDrag;

var a;
var b;

var filledMode;
var zBuffer;
var backFaceCulling;

var lightMode;                                                                                  //1 -> Pontual      0 -> Direcional
var lightState;                                                                                 //1 -> Ligada       0 -> Desligada

var canvasHeightSubtractor;

function fit_canvas_to_window() {
    canvas.width = window.innerWidth - CANVASWIDTHSUBTRACTOR;
    canvas.height = window.innerHeight - canvasHeightSubtractor;

    aspect = canvas.width / canvas.height;
    gl.viewport(0, 0,canvas.width, canvas.height);
}

window.onresize = function() {
    fit_canvas_to_window();
}

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if(!gl) { alert("WebGL isn't available"); }

    // Configure WebGL
    canvasHeightSubtractor = CANVASHEIGHTSUBTRACTORWITHLIGHT;
    fit_canvas_to_window();
    gl.clearColor(0.0, 0.0, 0.0, 0.8);                                                  

    sphereInit(gl);
    cubeInit(gl);
    torusInit(gl);
    cylinderInit(gl);
    parabolaInit(gl);
    
    // Load shaders and initialize attribute buffers
    program = initShaders(gl, "vertex-shader", "fragment-shader");

    mModelViewLoc = gl.getUniformLocation(program, "mModelView");
    mViewLoc = gl.getUniformLocation(program, "mView");
    mProjectionLoc = gl.getUniformLocation(program, "mProjection");
    mNormalsLoc = gl.getUniformLocation(program, "mNormals");
    mViewNormalsLoc = gl.getUniformLocation(program, "mViewNormals");
    perspProjectionLoc = gl.getUniformLocation(program, "perspProjection");

    objectSelect = document.getElementById("objectSelect");

    //SLIDERS DA VISTA LIVRE -------------------------------------------------------------------------------------------
    lSliderDiv = document.getElementById("lSliderDiv");
    lSliderDiv.style.display = "none";
    gSlider = document.getElementById("gSlider");
    tSlider = document.getElementById("tSlider");
    
    //SLIDER DA PERSPETIVA ---------------------------------------------------------------------------------------------
    dSliderDiv = document.getElementById("dSliderDiv");                                       
    dSliderDiv.style.display = "none";
    dSlider = document.getElementById("dSlider");

    //SLIDERS E VARIAVEIS DE ILUMINACAO --------------------------------------------------------------------------------
    illuminationDiv = document.getElementById("illuminationControls");
    
    vLightStateLoc = gl.getUniformLocation(program, "vLightState");
    fLightStateLoc = gl.getUniformLocation(program, "fLightState");
    lightModeLoc = gl.getUniformLocation(program, "illuminationType");

    lightPosLoc = gl.getUniformLocation(program, "lightPos");
    xLightPos = document.getElementById("xInputSlider");
    xLightValue = document.getElementById("xInput");
    yLightPos = document.getElementById("yInputSlider");
    yLightValue = document.getElementById("yInput");
    zLightPos = document.getElementById("zInputSlider");
    zLightValue = document.getElementById("zInput");


    kaLoc = gl.getUniformLocation(program, "fKa");
    kaSlider = document.getElementById("KaSlider");
    kdLoc = gl.getUniformLocation(program, "fKd");
    kdSlider = document.getElementById("KdSlider");
    ksLoc = gl.getUniformLocation(program, "fKs");
    ksSlider = document.getElementById("KsSlider");
    shineLoc = gl.getUniformLocation(program, "fShine");
    shineSlider = document.getElementById("shineSlider");

    sIntLoc = gl.getUniformLocation(program, "sourceLightIntensity");
    sIntSlider = document.getElementById("sISlider"); 
    aIntLoc = gl.getUniformLocation(program, "ambientLightIntensity");
    aIntSlider = document.getElementById("aISlider"); 

    aLightLoc = gl.getUniformLocation(program, "aLightColor");
    aLightClr = document.getElementById("aLightColor");
    sLightLoc = gl.getUniformLocation(program, "sLightColor");
    sLightClr = document.getElementById("sLightColor");
    objClrLoc = gl.getUniformLocation(program, "objectColor");
    objClr = document.getElementById("objectColor");


    //VALORES INICIAIS -------------------------------------------------------------------------------------------------                                                                           
    
    mModel = mat4();
    eye = [0, 0, 1];                                                               
    at = [0, 0, 0];
    up = [0, 1, 0];

    a = AD;
    b = BD;                                                                   
    
    filledMode = false;                                                                      
    zBuffer = false;
    backFaceCulling = false;

    projectionType = AXONO;
    draggableProjection = false;
    xAxisDrag = 0;
    yAxisDrag = 0;

    zoomValue = 1;

    lightState = 1.0;
    lightMode = 1.0;

    document.getElementById("proj").innerHTML = AXONO2;
    document.getElementById("zbuff").innerHTML = document.getElementById("bfcull").innerHTML = OFF;
    document.getElementById("dType").innerHTML = WIREF;

    //FUNCOES AUXILIARES -----------------------------------------------------------------------------------------------

    programEffects();
    programCameras();

    document.onwheel = zoom;
    
    canvas.onmousedown = startDrag;
    canvas.onmouseup = stopDrag;

    render();
}

function render() {

    gl.useProgram(program);

    if(zBuffer){
        gl.enable(gl.DEPTH_TEST);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }
    else{
        gl.disable(gl.DEPTH_TEST);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }
    
    if(backFaceCulling){
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);
    }
    else{
        gl.disable(gl.CULL_FACE);  
    }
    
    getProjection();
    
    gl.uniformMatrix4fv(mViewLoc, false, flatten(mView));
    
    mModelView = mult(mView, mModel);
    gl.uniformMatrix4fv(mModelViewLoc, false, flatten(mModelView));

    mNormals = normalMatrix(mModelView);
    gl.uniformMatrix4fv(mNormalsLoc, false, flatten(mNormals));

    mViewNormals = normalMatrix(mView);
    gl.uniformMatrix4fv(mViewNormalsLoc, false, flatten(mViewNormals));

    //PASSAGEM DOS VALORES DA ILUMINACAO
    gl.uniform1f(vLightStateLoc, lightState);
    gl.uniform1f(fLightStateLoc, lightState);
    gl.uniform1f(lightModeLoc, lightMode);
    gl.uniform3fv(lightPosLoc, [xLightPos.value, yLightPos.value, zLightPos.value]);
    xLightValue.innerHTML = xLightPos.value;
    yLightValue.innerHTML = yLightPos.value;
    zLightValue.innerHTML = zLightPos.value;


    gl.uniform3fv(aLightLoc, getRGBColor(aLightClr.value));
    gl.uniform3fv(sLightLoc, getRGBColor(sLightClr.value));
    gl.uniform3fv(objClrLoc, getRGBColor(objClr.value));
    gl.uniform1f(perspProjectionLoc, projectionType === PERSP);

    gl.uniform1f(kaLoc, kaSlider.value);
    gl.uniform1f(kdLoc, kdSlider.value);
    gl.uniform1f(ksLoc, ksSlider.value);
    gl.uniform1f(shineLoc, shineSlider.value);

    gl.uniform1f(aIntLoc, aIntSlider.value);
    gl.uniform1f(sIntLoc, sIntSlider.value);

    drawObjects();

    window.requestAnimationFrame(render);
} 

/*  FUNCAO UTILIZADA PARA ATIVAR/DESATIVAR EFEITOS DA APLICACAO
*/
function programEffects() {
    document.onkeypress = function(e) {
        switch (e.key) {
            case "w":
            case "W":
                filledMode = false;
                document.getElementById("dType").innerHTML = WIREF;
            break;
            case "f":
            case "F":
                filledMode = true;
                document.getElementById("dType").innerHTML = FILLED;
            break;
            case "z":
            case "Z":
                if(zBuffer)
                    document.getElementById("zbuff").innerHTML = OFF;
                else
                    document.getElementById("zbuff").innerHTML = ON;
                
                zBuffer = !zBuffer;
            break;
            case "b":
            case "B":
                if(backFaceCulling)
                    document.getElementById("bfcull").innerHTML = OFF;
                else
                    document.getElementById("bfcull").innerHTML = ON;

                backFaceCulling = !backFaceCulling;
            break;
            case "l":
            case "L":
                if(lightState){
                    lightState = 0.0;
                    illuminationDiv.style.display = "none";
                    canvasHeightSubtractor = CANVASHEIGHTSUBTRACTORWITHOUTLIGHT;
                }
                else{
                    lightState = 1.0;
                    illuminationDiv.style.display = "block";
                    canvasHeightSubtractor = CANVASHEIGHTSUBTRACTORWITHLIGHT;
                }
                fit_canvas_to_window();
            break;
        }
    }
}

/*  FUNCAO UTILIZADA PARA ALTERAR O A POSICAO DA CAMARA CONFORME O TIPO DE PROJECAO
*/
function programCameras() {
    document.onkeydown = function(e) {
        lSliderPrevStyle = lSliderDiv.style.display;
        dSliderPrevStyle = dSliderDiv.style.display;

        lSliderDiv.style.display = "none";
        dSliderDiv.style.display = "none";    
        switch (e.key) {
            case "1":   //ALCADO PRINCIPAL
                eye = [0, 0, 1];                                                                
                up = [0, 1, 0];
                projectionType = ORTHO;
                draggableProjection = false;
                document.getElementById("proj").innerHTML = ORTHO1;
            break;
            case "2":   //PLANTA
                eye = [0, 1, 0];                                                               
                up = [0, 0, -1];
                projectionType = ORTHO; 
                draggableProjection = false;
                document.getElementById("proj").innerHTML = ORTHO2;          
            break;
            case "3":   //ALCADO LATERAL DIREITO
                eye = [1, 0, 0];                                                                
                up = [0, 1, 0];
                projectionType = ORTHO;
                draggableProjection = false;
                document.getElementById("proj").innerHTML = ORTHO3;
            break;
            case "4":   //ISOMETRIA
                eye = [0, 0, 1];                                                                
                up = [0, 1, 0];
                projectionType = AXONO;
                draggableProjection = false;
                document.getElementById("proj").innerHTML = AXONO1;
                a = AI;
                b = BI;
            break;
            case "5":   //DIMETRIA
                eye = [0, 0, 1];                                                                
                up = [0, 1, 0];
                projectionType = AXONO;
                draggableProjection = false;
                document.getElementById("proj").innerHTML = AXONO2;
                a = AD;
                b = BD;
            break;
            case "6":   //TRIMETRIA
                eye = [0, 0, 1];                                                                
                up = [0, 1, 0];
                projectionType = AXONO;
                draggableProjection = false;
                document.getElementById("proj").innerHTML = AXONO3;
                a = AT;
                b = BT;
            break;
            case "7":   //LIVRE
                eye = [0, 0, 1];                                                                
                up = [0, 1, 0];
                lSliderDiv.style.display = "block";  
                projectionType = AXONO;
                draggableProjection = false;
                document.getElementById("proj").innerHTML = AXONO4;
            break;
            case "8":   //PERSPETIVA                                                                
                up = [0, 1, 0];                                                                 
                eye = [0, 0, 1]; 
                dSliderDiv.style.display = "block"; 
                projectionType = PERSP;
                draggableProjection = true;
                document.getElementById("proj").innerHTML = PERSP1;      
            break;
            default:    
                lSliderDiv.style.display = lSliderPrevStyle;
                dSliderDiv.style.display = dSliderPrevStyle; 

        }
    }
}

/*  FUNCAO RESPONSAVEL PELO O DESENHO DOS OBJETOS
*/
function drawObjects(){

    switch(true){
        case objectSelect.value == 0:                                                           //ESFERA
            if(filledMode)
                sphereDrawFilled(gl, program);
            else
                sphereDrawWireFrame(gl, program);
        break;
        case objectSelect.value == 1:                                                           //CUBE
            if(filledMode)
                cubeDrawFilled(gl, program);
            else
                cubeDrawWireFrame(gl, program);
        break;
        case objectSelect.value == 2:                                                           //TORUS
            if(filledMode)
                torusDrawFilled(gl, program);
            else
                torusDrawWireFrame(gl, program);
        break;
        case objectSelect.value == 3:                                                           //CILINDRO VERTICAL
            if(filledMode)
                cylinderDrawFilled(gl, program);
            else
                cylinderDrawWireFrame(gl, program);
        break;
        case objectSelect.value == 4:                                                           //PARABOLOIDE
            if(filledMode)
                parabolaDrawFilled(gl, program);
            else
                parabolaDrawWireFrame(gl, program);
        break;
        }
}

/*  FUNCAO QUE TRATA DAS MATRIZES MPROJECTION E MVIEW DEPENDENDO DO TIPO DE PROJECAO SELECIONADO
*/
function getProjection(){

    switch(projectionType){
        case ORTHO:
            mProjection = ortho(-zoomValue * aspect, zoomValue * aspect, -zoomValue, zoomValue, -10, 10);
            mView = lookAt(eye, at, up);
        break;
        case AXONO:
            mProjection = ortho(-zoomValue * aspect, zoomValue * aspect, -zoomValue, zoomValue, -10, 10);
            
            if(lSliderDiv.style.display === "block"){   //AXONOMETRIA LIVRE                   
                theta = -tSlider.value;
                gamma = gSlider.value;
            }
            else{
                theta = (Math.atan(Math.sqrt(Math.tan(a)/Math.tan(b)))-(Math.PI/2)) * 180/Math.PI;
                gamma = (Math.asin(Math.sqrt(Math.tan(a)*Math.tan(b)))) * 180/Math.PI;
            }

           eye = mult(rotateY(-theta), mult(rotateX(-gamma), [0,0,1,0]));
           mView = lookAt([eye[0], eye[1], eye[2]], at, up);

        break;
        case PERSP:
            dValue = (dSlider.valueAsNumber + 1)/2;
            fov = 2 * Math.atan(zoomValue/dValue) * 180/Math.PI;
            mProjection = perspective(fov, aspect, 0.1, dValue +100);
            eye = mult(rotateY(-yAxisDrag), mult(rotateX(-xAxisDrag), [0,0,dValue,0]));
            mView = lookAt([eye[0], eye[1], eye[2]], at, up);
        break;
    }  

    gl.uniformMatrix4fv(mProjectionLoc, false, flatten(mProjection));
}

/*  FUNCAO QUE ALTERA O VALOR DO ZOOM DA APLICACAO
*/
function zoom(event){
    if(event.deltaY < 0 && zoomValue > 1)
        zoomValue -= 0.25;

    if(event.deltaY > 0 && zoomValue < 50)
        zoomValue += 0.25;

}

/*  FUNCAO QUE COMECA O DRAG DO OBJETO NA PROJECAO PERSPETIVA
*/
function startDrag(event){
canvas.onmousemove = drag;
}

/*  FUNCAO QUE TRATA O DRAG DO OBJETO NA PROJECAO PERSPETIVA
*/
function drag(event){
    if(draggableProjection){
        var oldx = 0;
        var oldy = 0;

        if (event.movementX != oldx) {
            yAxisDrag += (event.movementX - oldx);
        }

        oldx = event.pageX;

        if (event.movementY != oldy) {
            xAxisDrag += (event.movementY - oldy);

            if(xAxisDrag > 90)                                  //Limites na rotação vertical
                xAxisDrag = 90;

            if(xAxisDrag < -90)
                xAxisDrag = -90;
        }

        oldy = event.pageY;
    }
}

/*  FUNCAO QUE PARA O DRAG DO OBJETO NA PROJECAO PERSPETIVA
*/
function stopDrag(event){
    canvas.onmousemove = null;
}

/*  FUNCAO QUE MOSTRA OS CONTROLOS DA APLICACAO
*/
function showControls(){
    alert(CONTROLSMESSAGE);
}

/*  FUNCAO QUE A PARTIR DE UM CODIDO HEXADECIMAL RETORNA O EQUIVALENTE EM RGB
    EXEMPLO: #ff0000 -> [1, 0, 0]
*/
function getRGBColor(hexDecimalCode){
    Rgb = hexToDecimal(hexDecimalCode.substring(1, 3)) / 255;
    rGb = hexToDecimal(hexDecimalCode.substring(3, 5)) / 255;
    rgB = hexToDecimal(hexDecimalCode.substring(5, 7)) / 255;
    return [Rgb, rGb, rgB];
}

/*  FUNCAO QUE CONVERTE DOIS CARATERES HEXADECIMAL PARA O SEU VALOR EM DECIMAL
    EXEMPLO: ff -> 255
*/
function hexToDecimal(hexDecimalValue){
    first = parseInt("0x" + hexDecimalValue.substring(0,1));
    second = parseInt("0x" + hexDecimalValue.substring(1,2));

    return first*16+second;
}
/*  FUNCAO QUE ALTERA O TIPO DE ILUMINACAO PARA PONTUAL
*/
function pontIllumination(){
    lightMode = 1;
}

/*  FUNCAO QUE ALTERA O TIPO DE ILUMINCAO PARA DIRECIONAL
*/
function dirIllumination(){
    lightMode = 0;
}