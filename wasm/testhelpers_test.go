package main

func makeSolidRGBA(w, h int, r, g, b uint8) []byte {
	rgba := make([]byte, w*h*4)
	for i := 0; i < w*h; i++ {
		rgba[i*4] = r
		rgba[i*4+1] = g
		rgba[i*4+2] = b
		rgba[i*4+3] = 255
	}
	return rgba
}

func makeGradientRGBA(w, h int) []byte {
	rgba := make([]byte, w*h*4)
	for y := 0; y < h; y++ {
		for x := 0; x < w; x++ {
			i := (y*w + x) * 4
			v := uint8((x * 255) / w)
			rgba[i] = v
			rgba[i+1] = v
			rgba[i+2] = v
			rgba[i+3] = 255
		}
	}
	return rgba
}
