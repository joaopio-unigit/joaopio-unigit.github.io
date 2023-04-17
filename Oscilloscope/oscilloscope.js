var gl;
var vertices;
var funcSelect;
var funcLocOne;
var time = 0;

const numberOfDots = 10000;
var numberOfDotsDrawn = 0;
var numberOfColumns = 12;
var numberOfRows = 8;
var waveVertexes = [];
var gridVertexes = [];
var oscState = true;                                                          //FALSE == DESLIGADO      TRUE == LIGADO
var prevFuncIndex;
var prevExtraIndex;

var waveSpeed = numberOfDots/numberOfColumns/60;                              //VELOCIDADE DA ONDA      1s/div

var xScales = [1e-4, 2e-4, 5e-4, 1e-3, 2e-3, 5e-3, 1e-2, 2e-2, 5e-2, 0.1, 0.2, 0.5, 1.0, 2.0, 5.0, 10.0]
var yScales = [0.1, 0.2, 0.5, 1.0, 2.0, 5.0, 10.0, 20.0, 50.0, 100.0, 200.0, 500.0];

window.onload = function init() {
  var canvas = document.getElementById("gl-canvas");
  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) {
    alert("WebGL isn't available");
  }

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  //Vertices
  getWaveVertexes();
  getGridVertexes();
  
  // Configure WebGL
  wave_program_one = initShaders(gl, "vertex-shader-wave", "fragment-shader");
  wave_program_two = initShaders(gl, "vertex-shader-wave", "fragment-shader");
  grid_program = initShaders(gl, "vertex-shader-grid", "fragment-shader");
  
  // Load the data into the GPU
  waveBuffer = gl.createBuffer();                                              //BUFFER PARA OS VERTICES DAS WAVES
  gl.bindBuffer(gl.ARRAY_BUFFER, waveBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(waveVertexes), gl.STATIC_DRAW);

  gridBuffer = gl.createBuffer();                                              //BUFFER PARA OS VERTICES DA GRID            
  gl.bindBuffer(gl.ARRAY_BUFFER, gridBuffer);   
  gl.bufferData(gl.ARRAY_BUFFER, flatten(gridVertexes), gl.STATIC_DRAW);

  

  // Associate our shader variables with our data buffer
  vTimeSampleOne = gl.getAttribLocation(wave_program_one, "vTimeSample");     //ATRIBUTOS DE WAVE_ONE
  waveOneFColorLoc = gl.getUniformLocation(wave_program_one, "fColor");

  vTimeSampleTwo = gl.getAttribLocation(wave_program_two, "vTimeSample");     //ATRIBUTOS DE WAVE_TWO
  waveTwoFColorLoc = gl.getUniformLocation(wave_program_two, "fColor");

  gridFColorLoc = gl.getUniformLocation(grid_program, "fColor");              //ATRBUTOS DE GRID
  vPosition = gl.getAttribLocation(grid_program, "vPosition");
  
  funcSelect = document.getElementById("select");                             //FUNCAO DA WAVE_ONE
  funcLocOne = gl.getUniformLocation(wave_program_one, "yFunc");
  
  extraWaveSelect = document.getElementById("selectExtra");                   //FUNCAO DA WAVE_TWO
  funcLocTwo = gl.getUniformLocation(wave_program_two, "yFunc");

  horizontalSelect = document.getElementById("selectHorizontal");             //OPCAO DO X
  horizontalLoc = gl.getUniformLocation(wave_program_one, "xFunc");           //PODEMOS ALTERAR NO FUTURO



  //Deslocamentos-----------------------------------------------------------------------------------------------
  xDispOne = document.getElementById("xSliderOne");                           //DESLOCAMENTO X DE WAVE_ONE
  xDisplacementLocOne = gl.getUniformLocation(wave_program_one, "xDisplacement");

  xDispTwo = document.getElementById("xSliderTwo");                           //DESLOCAMENTO X DE WAVE_TWO
  xDisplacementLocTwo = gl.getUniformLocation(wave_program_two, "xDisplacement");

  yDispOne = document.getElementById("ySliderOne");                           //DESLOCAMENTO Y DE WAVE_ONE
  yDisplacementLocOne = gl.getUniformLocation(wave_program_one, "yDisplacement");

  yDispTwo = document.getElementById("ySliderTwo");                           //DESLOCAMENTO Y DE WAVE_TWO
  yDisplacementLocTwo = gl.getUniformLocation(wave_program_two, "yDisplacement");



  //Escalas-----------------------------------------------------------------------------------------------------
  divVolts = document.getElementById("voltsListSlider");                      //VOLTS
  divVoltsOutput = document.getElementById("voltsOutput");
  divVoltsLocOne = gl.getUniformLocation(wave_program_one, "divVolts");
  divVoltsLocTwo = gl.getUniformLocation(wave_program_two, "divVolts");
  
  divSecs = document.getElementById("secsListSlider");                        //SECS
  divSecsOutput = document.getElementById("secsOutput");
  divSecsLocOne = gl.getUniformLocation(wave_program_one, "divSecs");
  divSecsLocTwo = gl.getUniformLocation(wave_program_two, "divSecs");
  
  numberOfColumnsLocOne = gl.getUniformLocation(wave_program_one, "numberOfColumns");     //COLUNAS E LINHAS
  numberOfRowsLocOne = gl.getUniformLocation(wave_program_one, "numberOfRows");

  numberOfColumnsLocTwo = gl.getUniformLocation(wave_program_two, "numberOfColumns");
  numberOfRowsLocTwo = gl.getUniformLocation(wave_program_two, "numberOfRows");

  timeLocOne = gl.getUniformLocation(wave_program_one, "time");                           //TEMPO
  timeLocTwo = gl.getUniformLocation(wave_program_two, "time");

  render();
};

/*
THIS CODE HAS BEEN DEVELOPED BY JOAO PIO
CONTACT ME AT:
jpbp.pio@gmail.com
https://www.linkedin.com/in/jpio-eng/
*/

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT);
  
  currFuncIndex = funcSelect.selectedIndex;                                   //REINICIAR O DESENHO APOS ALTERACAO NA ONDA
  currExtraIndex = extraWaveSelect.selectedIndex;
  
  if(prevFuncIndex != currFuncIndex || prevExtraIndex != currExtraIndex)
    numberOfDotsDrawn = 0;
  
  //ONDAS---------------------------------------------------------
  gl.bindBuffer(gl.ARRAY_BUFFER, waveBuffer);

  gl.useProgram(wave_program_one);                                            //-------------WAVE_ONE----------------
  
  gl.uniform1f(numberOfColumnsLocOne, numberOfColumns);                       //INFORMACAO DA GRID
  gl.uniform1f(numberOfRowsLocOne, numberOfRows);                                     
  
  gl.uniform1f(funcLocOne, currFuncIndex);                                    //OPCAO DA ONDA      
  gl.uniform1f(horizontalLoc, horizontalSelect.selectedIndex);
  
  gl.uniform1f(yDisplacementLocOne, yDispOne.value/10);                       //DESLOCAMENTOS
  gl.uniform1f(xDisplacementLocOne, xDispOne.value/10);

  gl.uniform4fv(waveOneFColorLoc, [0.0, 0.4, 1.0, 1.0]);                      //COR
  
  gl.uniform1f(divVoltsLocOne, yScales[divVolts.value]);                      //ESCALAS
  gl.uniform1f(divSecsLocOne, xScales[divSecs.value]);
  divVoltsOutput.innerHTML = yScales[divVolts.value];
  divSecsOutput.innerHTML = xScales[divSecs.value];

  gl.vertexAttribPointer(vTimeSampleOne, 1, gl.FLOAT, false, 0, 0);           //VERTICES
  gl.enableVertexAttribArray(vTimeSampleOne);
  
  gl.uniform1f(timeLocOne, time);                                             //TEMPO

  if(oscState){
    gl.drawArrays(gl.LINE_STRIP, 0, numberOfDotsDrawn);                       //DESENHAR A ONDA    


    if(currExtraIndex){
      gl.useProgram(wave_program_two);                                        //-------------WAVE_TWO----------------
      
      gl.uniform1f(numberOfColumnsLocTwo, numberOfColumns);                   //INFORMACAO DA GRID
      gl.uniform1f(numberOfRowsLocTwo, numberOfRows); 
      
      gl.uniform1f(funcLocTwo, currExtraIndex -1);                            //OPCAO DA ONDA

      gl.uniform1f(yDisplacementLocTwo, yDispTwo.value/10);                   //DESLOCAMENTOS
      gl.uniform1f(xDisplacementLocTwo, xDispTwo.value/10);

      gl.uniform1f(divVoltsLocTwo, yScales[divVolts.value]);                  //ESCALAS
      gl.uniform1f(divSecsLocTwo, xScales[divSecs.value]);

      gl.uniform4fv(waveTwoFColorLoc, [1.0, 1.0, 0.0, 1.0]);                  //COR

      gl.uniform1f(timeLocTwo, time);                                         //TEMPO

      gl.drawArrays(gl.LINE_STRIP, 0, numberOfDotsDrawn);
    }
  }
  

  //GRID----------------------------------------------------------
  gl.bindBuffer(gl.ARRAY_BUFFER, gridBuffer);
  gl.useProgram(grid_program);
  gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);
  gl.uniform4fv(gridFColorLoc, [1.0, 0.0, 0.0, 1.0]);
  gl.drawArrays(gl.LINES, 0, (numberOfRows+numberOfColumns -2)*2);



  numberOfDotsDrawn += waveSpeed * (1/xScales[divSecs.value]);                //VELOCADIDADE DA ONDA

  if(numberOfDotsDrawn >= numberOfDots){                                      //FIM DO OSCILOSCOPIO
    numberOfDotsDrawn = 0;                                                    //RESET
   
    if(12*xScales[divSecs.value] > 1/60)                                      //AVANCO NO TEMPO                    
      time += 12*xScales[divSecs.value];
    else
      time += 1/60;
  }
    
  prevFuncIndex = currFuncIndex;                                              
  prevExtraIndex = currExtraIndex;
  
  requestAnimationFrame(render);
}

function getWaveVertexes(){                                                   //VALORES PARA OS VERTICES DAS ONDAS
  for (var i = 0.0; i < numberOfDots; i++) {
    waveVertexes.push(i);
  }
}
function getGridVertexes(){                                                   //VERTICES DA GRELHA
  var dx = 2.0/(numberOfColumns);

    for(i = 1; i < numberOfColumns; i++){
        var xPos = -1.0 + i*dx;
        gridVertexes.push(vec2(xPos, -1));
        gridVertexes.push(vec2(xPos, 1));
    }

    var dy = 2.0/(numberOfRows);

    for(i = 1; i < numberOfRows; i++){
        var yPos = -1.0 + i*dy;
        gridVertexes.push(vec2(-1, yPos));
        gridVertexes.push(vec2(1, yPos));
    }
}
function onOffFunction(){                                                     //BUTAO ON/OFF
  oscState = !oscState;
  numberOfDotsDrawn = 0;
}