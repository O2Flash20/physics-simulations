export default /*wgsl*/ `

struct vertexShaderOutput {
    @builtin(position) position: vec4f,
    @location(0) uv: vec2f
};

@vertex fn vs( //the vertices
    @builtin(vertex_index) vertexIndex : u32
) -> vertexShaderOutput {
    let pos = array( //two triangles making a quad that covers the whole screen
        vec2f(-1.0, -1.0),
        vec2f(1.0, -1.0),
        vec2f(-1.0, 1.0),

        vec2f(-1.0, 1.0),
        vec2f(1.0, -1.0),
        vec2f(1.0, 1.0)
    );

    var output: vertexShaderOutput;
    let xy = pos[vertexIndex];
    output.position = vec4f(xy, 0.0, 1.0);
    output.uv = (xy + 1.)/2.;
    output.uv.y = -output.uv.y;

    return output;
}

struct uniforms {
    renderMode: u32
}

@group(0) @binding(0) var waveTexture: texture_2d<f32>;
@group(0) @binding(1) var colorTexture: texture_2d<f32>;
@group(0) @binding(2) var linearSampler: sampler;
@group(0) @binding(3) var obstacleDisplayTexture: texture_2d<f32>;
@group(0) @binding(4) var iorTexture: texture_2d<f32>;
@group(0) @binding(5) var iconsTexture: texture_2d<f32>;
@group(0) @binding(6) var<uniform> u: uniforms;

fn alphaMix(colTop: vec4f, colBottom: vec4f) -> vec4f {
    return colTop.a * colTop + (1-colTop.a) * colBottom;
}

@fragment fn fs(i:vertexShaderOutput)->@location(0)vec4f{ //the pixels, just the sum of the wave texture and the obstacles texture (which is black and white)
    let wave = textureSample(waveTexture, linearSampler, i.uv);
    let obstacle = textureSample(obstacleDisplayTexture, linearSampler, i.uv);
    let ior = textureSample(iorTexture, linearSampler, i.uv);
    let lightColor = textureSample(colorTexture, linearSampler, i.uv);
    let icon = textureSample(iconsTexture, linearSampler, i.uv);

    if (u.renderMode == 0) {
        return alphaMix(icon, alphaMix(obstacle, wave+ior-vec4f(0.5,0.5,0.5,0)));
    }
    else {
        let iorCol = ior-vec4f(0.5,0.5,0.5,0);
        return alphaMix(icon, alphaMix(obstacle, lightColor+iorCol*iorCol*iorCol));
    }
}

`