package main

import (
	"encoding/json"
	"fmt"
	"syscall/js"
)

func main() {
	js.Global().Set("__bdrsWasmReady", js.ValueOf(false))

	api := js.Global().Get("Object").New()

	api.Set("getVersion", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		result, _ := json.Marshal(FullVersion())
		return parseJSON(string(result))
	}))

	api.Set("analyzeImageQuality", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		if len(args) < 3 {
			return js.Null()
		}
		rgba, width, height := extractRGBA(args)
		if rgba == nil {
			return js.Null()
		}
		metrics := AnalyzeImageQuality(rgba, width, height)
		result, _ := json.Marshal(metrics)
		return parseJSON(string(result))
	}))

	api.Set("analyzeDocumentGeometry", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		if len(args) < 3 {
			return js.Null()
		}
		rgba, width, height := extractRGBA(args)
		if rgba == nil {
			return js.Null()
		}
		geo := AnalyzeDocumentGeometry(rgba, width, height)
		result, _ := json.Marshal(geo)
		return parseJSON(string(result))
	}))

	api.Set("detectFaces", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		if len(args) < 3 {
			return js.Null()
		}
		rgba, width, height := extractRGBA(args)
		if rgba == nil {
			return js.Null()
		}
		role := "selfie"
		if len(args) >= 4 && args[3].Type() == js.TypeString {
			role = args[3].String()
		}
		faces := DetectFaces(rgba, width, height, role)
		result, _ := json.Marshal(faces)
		return parseJSON(string(result))
	}))

	api.Set("validateDocument", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		if len(args) < 3 {
			return js.Null()
		}
		rawText := args[0].String()
		documentType := args[1].String()
		documentSide := "front"
		if len(args) >= 3 && args[2].Type() == js.TypeString {
			documentSide = args[2].String()
		}
		hasOcrEngine := true
		if len(args) >= 4 {
			hasOcrEngine = args[3].Truthy()
		}
		validation := ValidateDocument(rawText, documentType, documentSide, hasOcrEngine)
		result, _ := json.Marshal(validation)
		return parseJSON(string(result))
	}))

	api.Set("detectDocumentType", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		if len(args) < 1 {
			return js.Null()
		}
		rawText := args[0].String()
		candidate := DetectDocumentType(rawText)
		if candidate == nil {
			return js.Null()
		}
		result, _ := json.Marshal(candidate)
		return parseJSON(string(result))
	}))

	api.Set("extractFields", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		if len(args) < 2 {
			return js.Null()
		}
		rawText := args[0].String()
		selectedType := args[1].String()
		fields := ExtractFields(rawText, selectedType)
		result, _ := json.Marshal(fields)
		return parseJSON(string(result))
	}))

	api.Set("scoreDocumentType", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		if len(args) < 2 {
			return js.Null()
		}
		rawText := args[0].String()
		documentType := args[1].String()
		profile, ok := documentProfiles[documentType]
		if !ok {
			return js.ValueOf(0)
		}
		return js.ValueOf(scoreDocumentType(rawText, profile))
	}))

	api.Set("checkLiveness", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		if len(args) < 1 {
			return js.Null()
		}
		metrics := qualityFromJS(args[0])
		result := CheckLiveness(metrics)
		data, _ := json.Marshal(result)
		return parseJSON(string(data))
	}))

	api.Set("analyzeFraud", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		if len(args) < 2 {
			return js.Null()
		}
		idMetrics := qualityFromJS(args[0])
		selfieMetrics := qualityFromJS(args[1])
		idHash := ""
		selfieHash := ""
		if len(args) >= 3 && args[2].Type() == js.TypeString {
			idHash = args[2].String()
		}
		if len(args) >= 4 && args[3].Type() == js.TypeString {
			selfieHash = args[3].String()
		}
		result := AnalyzeFraud(idMetrics, selfieMetrics, idHash, selfieHash)
		data, _ := json.Marshal(result)
		return parseJSON(string(data))
	}))

	api.Set("validateSelfie", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		if len(args) < 3 {
			return js.Null()
		}
		rgba, width, height := extractRGBA(args)
		if rgba == nil {
			return js.Null()
		}
		result := ValidateSelfie(rgba, width, height)
		data, _ := json.Marshal(result)
		return parseJSON(string(data))
	}))

	api.Set("qualityIssues", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		if len(args) < 2 {
			return js.Null()
		}
		metrics := qualityFromJS(args[0])
		prefix := args[1].String()
		issues := QualityIssues(metrics, prefix)
		data, _ := json.Marshal(issues)
		return parseJSON(string(data))
	}))

	api.Set("browserQualityChecks", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		if len(args) < 2 {
			return js.Null()
		}
		metrics := qualityFromJS(args[0])
		role := args[1].String()
		issues, blocking := BrowserQualityChecks(metrics, role)
		data, _ := json.Marshal(map[string]interface{}{
			"issues":   issues,
			"blocking": blocking,
		})
		return parseJSON(string(data))
	}))

	api.Set("estimateBarcodeSignal", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		if len(args) < 3 {
			return js.Null()
		}
		rgba, width, height := extractRGBA(args)
		if rgba == nil {
			return js.Null()
		}
		result := EstimateBarcodeSignal(rgba, width, height)
		data, _ := json.Marshal(result)
		return parseJSON(string(data))
	}))

	api.Set("collectBackIDEvidence", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		if len(args) < 3 {
			return js.Null()
		}
		rawText := args[0].String()
		metrics := qualityFromJS(args[1])
		expectedScore := args[2].Int()
		result := CollectBackIDEvidence(rawText, metrics, expectedScore)
		data, _ := json.Marshal(result)
		return parseJSON(string(data))
	}))

	js.Global().Set("__bdrsWasm", api)
	js.Global().Set("__bdrsWasmReady", js.ValueOf(true))
	fmt.Printf("BDRS WASM Validator v%s loaded\n", VersionString())

	select {}
}

func extractRGBA(args []js.Value) ([]byte, int, int) {
	if len(args) < 3 {
		return nil, 0, 0
	}

	jsBuf := args[0]
	width := args[1].Int()
	height := args[2].Int()

	if jsBuf.Type() != js.TypeObject {
		return nil, 0, 0
	}

	byteLen := width * height * 4
	if byteLen <= 0 {
		return nil, 0, 0
	}

	src := js.Global().Get("Uint8Array").New(jsBuf, 0, byteLen)
	dst := make([]byte, byteLen)
	js.CopyBytesToGo(dst, src)

	return dst, width, height
}

func qualityFromJS(v js.Value) QualityMetrics {
	if v.Type() != js.TypeObject {
		return QualityMetrics{}
	}
	jsonStr := js.Global().Get("JSON").Call("stringify", v).String()
	var m QualityMetrics
	json.Unmarshal([]byte(jsonStr), &m)
	return m
}

func parseJSON(s string) js.Value {
	return js.Global().Get("JSON").Call("parse", s)
}
