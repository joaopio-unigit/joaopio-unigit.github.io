var para_points = [];
var para_normals = [];
var para_faces = [];
var para_edges = [];

var para_points_buffer;
var para_normals_buffer;
var para_faces_buffer;
var para_edges_buffer;

var PARA_LATS=20;
var PARA_LONS=30;

function parabolaInit(gl, nlat, nlon) {
    nlat = nlat | SPHERE_LATS;
    nlon = nlon | SPHERE_LONS;
    parabolaBuild(nlat, nlon);
    parabolaUploadData(gl);

}


// Generate points using polar coordinates
function parabolaBuild(nlat, nlon){

    // phi will be latitude

    // theta will be longitude 
    var d_phi = (Math.PI) / (nlat+1);
    var d_theta = 2*Math.PI / nlon;
    var r = 0.5;

    // Genreate the points

    // Generate north polar cap points and normals
    var north = vec3(0,0,0);

    para_points.push(north);
    para_normals.push(vec3(0,1,0));


    // Generate middle points and normals

   for(var i=0, phi=Math.PI/2-d_phi; i<nlat; i++, phi-=d_phi) {
       
        for(var j=0, theta=0; j<nlon; j++, theta+=d_theta) {
            
            var x = r*Math.cos(phi)*Math.cos(theta);
            var z = r*Math.cos(phi)*Math.sin(theta);

            var pt = vec3(x,Math.pow(x,2)+ Math.pow(z,2),z);

            para_points.push(pt);

            var n = vec3(pt);

            para_normals.push(normalize(n));

        }

    }
    
    // Generate the faces

    for(var i=0; i<nlon-1; i++) {
        para_faces.push(0);
        para_faces.push(i+2);
        para_faces.push(i+1);
    }
    para_faces.push(0);
    para_faces.push(1);
    para_faces.push(nlon);

    for(var i=0; i<nlon-1; i++) {
        para_faces.push(0);
        para_faces.push(i+1);
        para_faces.push(i+2);
    }
    para_faces.push(0);
    para_faces.push(nlon);
    para_faces.push(1);

    

    // general middle faces

    var offset=1;

    

    for(var i=0; i<nlat-1; i++) {

        for(var j=0; j<nlon-1; j++) {

            var p = offset+i*nlon+j;

            para_faces.push(p);
            para_faces.push(p+nlon+1);
            para_faces.push(p+nlon);
            
            

            para_faces.push(p);
            para_faces.push(p+1);
            para_faces.push(p+nlon+1);


        }

        var p = offset+i*nlon+nlon-1;

        para_faces.push(p);
        para_faces.push(p+1);
        para_faces.push(p+nlon);

        para_faces.push(p);
        para_faces.push(p-nlon+1);
        para_faces.push(p+1);
    } 

    // Build the edges

    for(var i=0; i<nlon; i++) {

        para_edges.push(0);   // North pole 

        para_edges.push(i+1);

    }

    for(var i=0; i<nlat; i++, p++) {

        for(var j=0; j<nlon;j++, p++) {

            var p =  1+ i*nlon + j;
            para_edges.push(p);   // horizontal line (same latitude)

            if(j!=nlon-1) 

                para_edges.push(p+1);

            else para_edges.push(p+1-nlon);

            

            if(i!=nlat-1) {

                para_edges.push(p);   // vertical line (same longitude)

                para_edges.push(p+nlon);

            }
        }
    }
}



function parabolaUploadData(gl){

    para_points_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, para_points_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(para_points), gl.STATIC_DRAW);

    

    para_normals_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, para_normals_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(para_normals), gl.STATIC_DRAW);

    

    para_faces_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, para_faces_buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(para_faces), gl.STATIC_DRAW);

    

    para_edges_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, para_edges_buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(para_edges), gl.STATIC_DRAW);

}



function parabolaDrawWireFrame(gl, program)

{    

    gl.useProgram(program);

    

    gl.bindBuffer(gl.ARRAY_BUFFER, para_points_buffer);
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    

    gl.bindBuffer(gl.ARRAY_BUFFER, para_normals_buffer);
    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(vNormal);

    

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, para_edges_buffer);

    gl.drawElements(gl.LINES, para_edges.length, gl.UNSIGNED_SHORT, 0);

}



function parabolaDrawFilled(gl, program)

{

    gl.useProgram(program);

    

    gl.bindBuffer(gl.ARRAY_BUFFER, para_points_buffer);

    var vPosition = gl.getAttribLocation(program, "vPosition");

    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(vPosition);

    

    gl.bindBuffer(gl.ARRAY_BUFFER, para_normals_buffer);

    var vNormal = gl.getAttribLocation(program, "vNormal");

    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(vNormal);

    

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, para_faces_buffer);

    gl.drawElements(gl.TRIANGLES, para_faces.length, gl.UNSIGNED_SHORT, 0);

}