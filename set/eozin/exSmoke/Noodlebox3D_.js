var Noodlebox3D = Noodlebox3D || {};

Noodlebox3D.init = function(canvas, alpha, antialias){

    if (alpha!=true) alpha=false;
    if (antialias!=true) antialias=false;

    var gl;

    try {
        gl = canvas.getContext("experimental-webgl", {alpha:alpha,antialias:antialias});
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    } catch (e) {}

    if (!gl) {
        alert("Could not initialise WebGL, sorry :-(");
        return;
    }

    //

    var vertices = [-1,-1,1.0,1,-1,1.0,1,1,1.0,1,1,1.0,-1,1,1.0,-1,-1,1.0];
    var textureCoords = [0,0,1,0,1,1,1,1,0,1,0,0];
    var combined = [
        -1,-1,0,0,
        1,-1,1,0,
        1,1,1,1,
        1,1,1,1,
        -1,1,0,1,
        -1,-1,0,0
        ];

    // vertices

    gl.unitVertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.unitVertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.unitVertexBuffer.itemSize = 3;
    gl.unitVertexBuffer.numItems = 6;

    // uv

    gl.unitUVBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.unitUVBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
    gl.unitUVBuffer.itemSize = 2;
    gl.unitUVBuffer.numItems = 6;

    // combined

    gl.unitBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.unitBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(combined), gl.STATIC_DRAW);
    gl.unitBuffer.itemSize = 4;
    gl.unitBuffer.numItems = 6;

    //

    return gl;

};

Noodlebox3D.compileShaderScript = function(gl, id) {
   
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }

    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
        if (k.nodeType == 3) {
            str += k.textContent;
        }
        k = k.nextSibling;
    }

    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;

}

Noodlebox3D.compileProgram = function(gl, vertexShader, fragmentShader) {

        var shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            alert(gl.getProgramInfoLog(shaderProgram));
        }

        return shaderProgram;

}

Noodlebox3D.createStaticBuffer = function(gl, bufferType, dataArray, dataType, dataItemSize) {

        var newBuffer = gl.createBuffer();
        gl.bindBuffer(bufferType, newBuffer);
        gl.bufferData(bufferType, new dataType(dataArray), gl.STATIC_DRAW);
        newBuffer.itemSize = dataItemSize;
        newBuffer.numItems = dataArray.length / dataItemSize;

        return newBuffer;

}

Noodlebox3D.createTextureFromURL = function(gl, URL, alpha, minFilter, magFilter, clamp) {

    if (minFilter==undefined) minFilter = gl.NEAREST;
    if (magFilter==undefined) magFilter = gl.NEAREST;

    var mode=gl.RGB;
    if (alpha==true) mode=gl.RGBA;

    var texture = gl.createTexture();
    var textureImage = new Image();

    texture.image = textureImage;
    textureImage.texture = texture;

    textureImage.onload = function(){

        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, mode, mode, gl.UNSIGNED_BYTE, this.texture.image);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);

        if (clamp) {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        }

        gl.bindTexture(gl.TEXTURE_2D, null);

    };

    textureImage.src = URL;

    return texture;

}

Noodlebox3D.createTexture = function(gl, widthAndHeight, alpha, minFilter, magFilter, clamp) {

    if (minFilter==undefined) minFilter = gl.NEAREST;
    if (magFilter==undefined) magFilter = gl.NEAREST;

    var mode=gl.RGB;
    if (alpha==true) mode=gl.RGBA;

    var texture = gl.createTexture();

    texture.width=widthAndHeight;
    texture.height=widthAndHeight;

    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texImage2D(gl.TEXTURE_2D, 0, mode, widthAndHeight, widthAndHeight, 0, mode, gl.UNSIGNED_BYTE, null);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);

    if (clamp) {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }

    gl.bindTexture(gl.TEXTURE_2D, null);

    return texture;

}

Noodlebox3D.copyImageToTexture = function(gl, texture, imageVideoOrCanvas) {

        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

        gl.bindTexture(gl.TEXTURE_2D, texture);
        
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageVideoOrCanvas);

        gl.bindTexture(gl.TEXTURE_2D, null);

}

Noodlebox3D.createRenderableTexture = function(gl, widthAndHeight, alpha, depth, minFilter, magFilter, clamp) {

    return Noodlebox3D.createOffscreenBuffer(gl, widthAndHeight, alpha, depth, minFilter, magFilter, clamp).texture;

}

Noodlebox3D.createOffscreenBuffer = function(gl, widthAndHeight, alpha, depth, minFilter, magFilter, clamp) {

        if (minFilter==undefined) minFilter = gl.NEAREST;
        if (magFilter==undefined) magFilter = gl.NEAREST;

        var mode=gl.RGB;
        if (alpha==true) mode=gl.RGBA;

        if (depth===undefined) depth=false;
        
        var frameBuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);

        frameBuffer.width = widthAndHeight;
        frameBuffer.height = widthAndHeight;

        var frameBufferTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, frameBufferTexture);

        gl.texImage2D(gl.TEXTURE_2D, 0, mode, frameBuffer.width, frameBuffer.height, 0, mode, gl.UNSIGNED_BYTE, null);
        
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);

        if (clamp) {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        }

        frameBufferTexture.width=frameBuffer.width;
        frameBufferTexture.height=frameBuffer.height;

        if (depth) {

            var renderbuffer = gl.createRenderbuffer();
            gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, frameBuffer.width, frameBuffer.height);

        }

        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, frameBufferTexture, 0);
        if (depth) gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);

        gl.bindTexture(gl.TEXTURE_2D, null);
        if (depth) gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        frameBuffer.texture = frameBufferTexture;
        if (depth) frameBuffer.renderbuffer = renderbuffer;
        frameBufferTexture.frameBuffer = frameBuffer;

        return frameBuffer;

}

Noodlebox3D.enableRenderToTexture = function(gl, renderableTexture) {

        gl.bindFramebuffer(gl.FRAMEBUFFER, renderableTexture.frameBuffer);
        gl.viewport(0, 0, renderableTexture.width, renderableTexture.height);

}

Noodlebox3D.disableRenderToTexture = function(gl, renderableTexture) {

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, renderableTexture);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);

        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);

}

Noodlebox3D.enableAttributes = function(gl, program) {
        
        var count = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);

        for (var i = 0; i < count; i++)
        {
            gl.enableVertexAttribArray(i);
        }

}

Noodlebox3D.disableAttributes = function(gl, program) {
        
        var count = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);

        for (var i = 0; i < count; i++)
        {
            gl.disableVertexAttribArray(i);
        }

}

Noodlebox3D.flatFill = function(gl, colorArrayVec4) {

    if (Noodlebox3D.flatFillProgram===undefined) {

        Noodlebox3D.flatFillProgram = Noodlebox3D.compileProgram(
            gl,
            Noodlebox3D.compileShaderScript(gl, "flat-fill-shader-vs"), 
            Noodlebox3D.compileShaderScript(gl, "flat-fill-shader-fs")
        );

        Noodlebox3D.flatFillProgram.p_aVertexPosition = gl.getAttribLocation(Noodlebox3D.flatFillProgram, "aVertexPosition");
        Noodlebox3D.flatFillProgram.p_uColor = gl.getUniformLocation(Noodlebox3D.flatFillProgram, "uColor");

    }

    gl.useProgram(Noodlebox3D.flatFillProgram);

    Noodlebox3D.enableAttributes(gl,Noodlebox3D.flatFillProgram);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.unitVertexBuffer);

    gl.vertexAttribPointer(Noodlebox3D.flatFillProgram.p_aVertexPosition, gl.unitVertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.uniform4fv(Noodlebox3D.flatFillProgram.p_uColor, colorArrayVec4);

    gl.drawArrays(gl.TRIANGLES, 0, gl.unitVertexBuffer.numItems);

    Noodlebox3D.disableAttributes(gl,Noodlebox3D.flatFillProgram);

}

Noodlebox3D.differenceFilter = function(gl, texture1, texture2, colorTransformVec2) {

    if (colorTransformVec2===undefined) colorTransformVec2 = new Float32Array( [-0.1,4.2] );

    if (Noodlebox3D.differenceProgram===undefined) {

        Noodlebox3D.differenceProgram = Noodlebox3D.compileProgram(
            gl,
            Noodlebox3D.compileShaderScript(gl, "texture-difference-shader-vs"),
            Noodlebox3D.compileShaderScript(gl, "texture-difference-shader-fs")
        );

        Noodlebox3D.differenceProgram.p_aVertexPosition = gl.getAttribLocation(Noodlebox3D.differenceProgram, "aVertexPosition");
        Noodlebox3D.differenceProgram.p_aVertexUV = gl.getAttribLocation(Noodlebox3D.differenceProgram, "aVertexUV");

        Noodlebox3D.differenceProgram.p_uSampler1 = gl.getUniformLocation(Noodlebox3D.differenceProgram, "uSampler1");
        Noodlebox3D.differenceProgram.p_uSampler2 = gl.getUniformLocation(Noodlebox3D.differenceProgram, "uSampler2");

        Noodlebox3D.differenceProgram.p_uColorTransform = gl.getUniformLocation(Noodlebox3D.differenceProgram, "uColorTransform");

    }

    gl.useProgram(Noodlebox3D.differenceProgram);

    Noodlebox3D.enableAttributes(gl,Noodlebox3D.differenceProgram);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture1);
    gl.uniform1i(Noodlebox3D.differenceProgram.p_uSampler1, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture2);
    gl.uniform1i(Noodlebox3D.differenceProgram.p_uSampler2, 1);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.unitBuffer);
    gl.vertexAttribPointer(Noodlebox3D.differenceProgram.p_aVertexPosition, 2, gl.FLOAT, false, 16, 0);
    gl.vertexAttribPointer(Noodlebox3D.differenceProgram.p_aVertexUV,  2, gl.FLOAT, false, 16, 8);

    gl.uniform2fv(Noodlebox3D.differenceProgram.p_uColorTransform, colorTransformVec2 );

    gl.drawArrays(gl.TRIANGLES, 0, gl.unitBuffer.numItems);

    Noodlebox3D.disableAttributes(gl,Noodlebox3D.differenceProgram);

}

Noodlebox3D.textureFillFilter = function(gl, texture) {

    if (Noodlebox3D.textureFillProgram===undefined) {

        Noodlebox3D.textureFillProgram = Noodlebox3D.compileProgram(
            gl,
            Noodlebox3D.compileShaderScript(gl, "texture-fill-shader-vs"),
            Noodlebox3D.compileShaderScript(gl, "texture-fill-shader-fs")
        );

        Noodlebox3D.textureFillProgram.p_aVertexPosition = gl.getAttribLocation(Noodlebox3D.textureFillProgram, "aVertexPosition");
        Noodlebox3D.textureFillProgram.p_aVertexUV = gl.getAttribLocation(Noodlebox3D.textureFillProgram, "aVertexUV");

        Noodlebox3D.textureFillProgram.p_uSampler = gl.getUniformLocation(Noodlebox3D.textureFillProgram, "uSampler");

    }

    gl.useProgram(Noodlebox3D.textureFillProgram);

    Noodlebox3D.enableAttributes(gl,Noodlebox3D.textureFillProgram);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(Noodlebox3D.textureFillProgram.p_uSampler, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.unitBuffer);
    gl.vertexAttribPointer(Noodlebox3D.textureFillProgram.p_aVertexPosition, 2, gl.FLOAT, false, 16, 0);
    gl.vertexAttribPointer(Noodlebox3D.textureFillProgram.p_aVertexUV,  2, gl.FLOAT, false, 16, 8);

    gl.drawArrays(gl.TRIANGLES, 0, gl.unitBuffer.numItems);

    Noodlebox3D.disableAttributes(gl,Noodlebox3D.textureFillProgram);

}


Noodlebox3D.horizontalBlurFilter = function(gl, texture, factor) {

    if (factor==undefined) factor = 1.0 / 512.00;

    if (Noodlebox3D.horizontalBlurProgram===undefined) {

        Noodlebox3D.horizontalBlurProgram = Noodlebox3D.compileProgram(
            gl,
            Noodlebox3D.compileShaderScript(gl, "blur-shader-vs"),
            Noodlebox3D.compileShaderScript(gl, "horizontal-blur-shader-fs")
        );

        Noodlebox3D.horizontalBlurProgram.p_aVertexPosition = gl.getAttribLocation(Noodlebox3D.horizontalBlurProgram, "aVertexPosition");
        Noodlebox3D.horizontalBlurProgram.p_aVertexUV = gl.getAttribLocation(Noodlebox3D.horizontalBlurProgram, "aVertexUV");

        Noodlebox3D.horizontalBlurProgram.p_uSampler = gl.getUniformLocation(Noodlebox3D.horizontalBlurProgram, "uSampler");
        Noodlebox3D.horizontalBlurProgram.p_uFactor = gl.getUniformLocation(Noodlebox3D.horizontalBlurProgram, "uFactor");

    }

    gl.useProgram(Noodlebox3D.horizontalBlurProgram);

    Noodlebox3D.enableAttributes(gl,Noodlebox3D.horizontalBlurProgram);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(Noodlebox3D.horizontalBlurProgram.p_uSampler, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.unitBuffer);
    gl.vertexAttribPointer(Noodlebox3D.horizontalBlurProgram.p_aVertexPosition, 2, gl.FLOAT, false, 16, 0);
    gl.vertexAttribPointer(Noodlebox3D.horizontalBlurProgram.p_aVertexUV,  2, gl.FLOAT, false, 16, 8);

    gl.uniform1fv(Noodlebox3D.horizontalBlurProgram.p_uFactor, new Float32Array([factor]));

    gl.drawArrays(gl.TRIANGLES, 0, gl.unitBuffer.numItems);

    Noodlebox3D.disableAttributes(gl,Noodlebox3D.horizontalBlurProgram);

}

Noodlebox3D.verticalBlurFilter = function(gl, texture, factor) {

    if (factor==undefined) factor = 1.0 / 512.00;

    if (Noodlebox3D.verticalBlurProgram===undefined) {

        Noodlebox3D.verticalBlurProgram = Noodlebox3D.compileProgram(
            gl,
            Noodlebox3D.compileShaderScript(gl, "blur-shader-vs"),
            Noodlebox3D.compileShaderScript(gl, "vertical-blur-shader-fs")
        );

        Noodlebox3D.verticalBlurProgram.p_aVertexPosition = gl.getAttribLocation(Noodlebox3D.verticalBlurProgram, "aVertexPosition");
        Noodlebox3D.verticalBlurProgram.p_aVertexUV = gl.getAttribLocation(Noodlebox3D.verticalBlurProgram, "aVertexUV");

        Noodlebox3D.verticalBlurProgram.p_uSampler = gl.getUniformLocation(Noodlebox3D.verticalBlurProgram, "uSampler");
        Noodlebox3D.verticalBlurProgram.p_uFactor = gl.getUniformLocation(Noodlebox3D.verticalBlurProgram, "uFactor");

    }

    gl.useProgram(Noodlebox3D.verticalBlurProgram);

    Noodlebox3D.enableAttributes(gl,Noodlebox3D.verticalBlurProgram);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(Noodlebox3D.verticalBlurProgram.p_uSampler, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.unitBuffer);
    gl.vertexAttribPointer(Noodlebox3D.verticalBlurProgram.p_aVertexPosition, 2, gl.FLOAT, false, 16, 0);
    gl.vertexAttribPointer(Noodlebox3D.verticalBlurProgram.p_aVertexUV,  2, gl.FLOAT, false, 16, 8);

    gl.uniform1fv(Noodlebox3D.verticalBlurProgram.p_uFactor, new Float32Array([factor]));

    gl.drawArrays(gl.TRIANGLES, 0, gl.unitBuffer.numItems);

    Noodlebox3D.disableAttributes(gl,Noodlebox3D.verticalBlurProgram);

}


Noodlebox3D.blurFilter = function(gl, texture, factor) {

    if (factor==undefined) factor = 1.0 / 512.00;

    if (Noodlebox3D.blurProgram===undefined) {

        Noodlebox3D.blurProgram = Noodlebox3D.compileProgram(
            gl,
            Noodlebox3D.compileShaderScript(gl, "blur-shader-vs"),
            Noodlebox3D.compileShaderScript(gl, "blur-shader-fs")
        );

        Noodlebox3D.blurProgram.p_aVertexPosition = gl.getAttribLocation(Noodlebox3D.blurProgram, "aVertexPosition");
        Noodlebox3D.blurProgram.p_aVertexUV = gl.getAttribLocation(Noodlebox3D.blurProgram, "aVertexUV");

        Noodlebox3D.blurProgram.p_uSampler = gl.getUniformLocation(Noodlebox3D.blurProgram, "uSampler");
        Noodlebox3D.blurProgram.p_uFactor = gl.getUniformLocation(Noodlebox3D.blurProgram, "uFactor");

    }

    gl.useProgram(Noodlebox3D.blurProgram);

    Noodlebox3D.enableAttributes(gl,Noodlebox3D.blurProgram);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(Noodlebox3D.blurProgram.p_uSampler, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.unitBuffer);
    gl.vertexAttribPointer(Noodlebox3D.blurProgram.p_aVertexPosition, 2, gl.FLOAT, false, 16, 0);
    gl.vertexAttribPointer(Noodlebox3D.blurProgram.p_aVertexUV,  2, gl.FLOAT, false, 16, 8);

    gl.uniform1fv(Noodlebox3D.blurProgram.p_uFactor, new Float32Array([factor]));

    gl.drawArrays(gl.TRIANGLES, 0, gl.unitBuffer.numItems);

    Noodlebox3D.disableAttributes(gl,Noodlebox3D.blurProgram);

}



Noodlebox3D.circularBlurFilter = function(gl, texture, factor) {

    if (factor==undefined) factor = 1.0 / 512.00;

    if (Noodlebox3D.circularBlurProgram===undefined) {

        Noodlebox3D.circularBlurProgram = Noodlebox3D.compileProgram(
            gl,
            Noodlebox3D.compileShaderScript(gl, "blur-shader-vs"),
            Noodlebox3D.compileShaderScript(gl, "circular-blur-shader-fs")
        );

        Noodlebox3D.circularBlurProgram.p_aVertexPosition = gl.getAttribLocation(Noodlebox3D.circularBlurProgram, "aVertexPosition");
        Noodlebox3D.circularBlurProgram.p_aVertexUV = gl.getAttribLocation(Noodlebox3D.circularBlurProgram, "aVertexUV");

        Noodlebox3D.circularBlurProgram.p_uSampler = gl.getUniformLocation(Noodlebox3D.circularBlurProgram, "uSampler");
        Noodlebox3D.circularBlurProgram.p_uFactor = gl.getUniformLocation(Noodlebox3D.circularBlurProgram, "uFactor");

    }

    gl.useProgram(Noodlebox3D.circularBlurProgram);

    Noodlebox3D.enableAttributes(gl,Noodlebox3D.circularBlurProgram);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(Noodlebox3D.circularBlurProgram.p_uSampler, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.unitBuffer);
    gl.vertexAttribPointer(Noodlebox3D.circularBlurProgram.p_aVertexPosition, 2, gl.FLOAT, false, 16, 0);
    gl.vertexAttribPointer(Noodlebox3D.circularBlurProgram.p_aVertexUV,  2, gl.FLOAT, false, 16, 8);

    gl.uniform1fv(Noodlebox3D.circularBlurProgram.p_uFactor, new Float32Array([factor]));

    gl.drawArrays(gl.TRIANGLES, 0, gl.unitBuffer.numItems);

    Noodlebox3D.disableAttributes(gl,Noodlebox3D.circularBlurProgram);

}



Noodlebox3D.textureBlurFilter = function(gl, imageTexture, factorTexture, factor) {

    if (factor==undefined) factor = 1.0 / 512.00;

    if (Noodlebox3D.textureBlurProgram===undefined) {

        Noodlebox3D.textureBlurProgram = Noodlebox3D.compileProgram(
            gl,
            Noodlebox3D.compileShaderScript(gl, "blur-shader-vs"),
            Noodlebox3D.compileShaderScript(gl, "texture-blur-shader-fs")
        );

        Noodlebox3D.textureBlurProgram.p_aVertexPosition = gl.getAttribLocation(Noodlebox3D.textureBlurProgram, "aVertexPosition");
        Noodlebox3D.textureBlurProgram.p_aVertexUV = gl.getAttribLocation(Noodlebox3D.textureBlurProgram, "aVertexUV");

        Noodlebox3D.textureBlurProgram.p_uSampler = gl.getUniformLocation(Noodlebox3D.textureBlurProgram, "uSampler");
        Noodlebox3D.textureBlurProgram.p_uFactorSampler = gl.getUniformLocation(Noodlebox3D.textureBlurProgram, "uFactorSampler");
        
        Noodlebox3D.textureBlurProgram.p_uFactor = gl.getUniformLocation(Noodlebox3D.textureBlurProgram, "uFactor");


        var l = 12;
        for (var i = 0; i < l; i++) {

        console.log("result += texture2D( uSampler , vec2(vTextureCoord.x + "+Math.sin(i*Math.PI*2/l)+"*finalFactor, vTextureCoord.y + "+Math.cos(i*Math.PI*2/l)+"*finalFactor)) ;");
        
        };

    }

    gl.useProgram(Noodlebox3D.textureBlurProgram);

    Noodlebox3D.enableAttributes(gl,Noodlebox3D.textureBlurProgram);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, imageTexture);
    gl.uniform1i(Noodlebox3D.textureBlurProgram.p_uSampler, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, factorTexture);
    gl.uniform1i(Noodlebox3D.textureBlurProgram.p_uFactorSampler, 1);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.unitBuffer);
    gl.vertexAttribPointer(Noodlebox3D.textureBlurProgram.p_aVertexPosition, 2, gl.FLOAT, false, 16, 0);
    gl.vertexAttribPointer(Noodlebox3D.textureBlurProgram.p_aVertexUV,  2, gl.FLOAT, false, 16, 8);

    gl.uniform1fv(Noodlebox3D.textureBlurProgram.p_uFactor, new Float32Array([factor]));

    gl.drawArrays(gl.TRIANGLES, 0, gl.unitBuffer.numItems);

    Noodlebox3D.disableAttributes(gl,Noodlebox3D.textureBlurProgram);

}
