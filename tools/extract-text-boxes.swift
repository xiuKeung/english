import AppKit
import Vision

guard CommandLine.arguments.count == 2,
      let image = NSImage(contentsOfFile: CommandLine.arguments[1]),
      let cgImage = image.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
  fputs("Usage: swift extract-text-boxes.swift <image>\n", stderr)
  exit(1)
}

let request = VNRecognizeTextRequest { request, error in
  if let error { fputs("Vision error: \(error)\n", stderr); return }
  for case let observation as VNRecognizedTextObservation in request.results ?? [] {
    guard let candidate = observation.topCandidates(1).first else { continue }
    let box = observation.boundingBox
    print("\(candidate.string)\t\(box.origin.x),\(box.origin.y),\(box.width),\(box.height)")
  }
}
request.recognitionLevel = .accurate
request.recognitionLanguages = ["en-US"]
request.usesLanguageCorrection = false

let handler = VNImageRequestHandler(cgImage: cgImage)
try handler.perform([request])
