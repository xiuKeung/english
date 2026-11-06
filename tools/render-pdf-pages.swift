import AppKit
import PDFKit

guard CommandLine.arguments.count == 4,
      let document = PDFDocument(url: URL(fileURLWithPath: CommandLine.arguments[1])),
      let start = Int(CommandLine.arguments[2]),
      let end = Int(CommandLine.arguments[3]),
      start >= 1, end >= start else {
  fputs("Usage: swift render-pdf-pages.swift <pdf> <start-page> <end-page>\n", stderr)
  exit(1)
}

let outputDirectory = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
  .appendingPathComponent("resources/pages")
try FileManager.default.createDirectory(at: outputDirectory, withIntermediateDirectories: true)

for number in start...min(end, document.pageCount) {
  guard let page = document.page(at: number - 1) else { continue }
  let bounds = page.bounds(for: .mediaBox)
  let scale: CGFloat = 2
  let size = NSSize(width: bounds.width * scale, height: bounds.height * scale)
  let image = NSImage(size: size)
  image.lockFocus()
  guard let context = NSGraphicsContext.current?.cgContext else { fatalError("Unable to create graphics context") }
  context.setFillColor(NSColor.white.cgColor)
  context.fill(CGRect(origin: .zero, size: size))
  context.saveGState()
  context.scaleBy(x: scale, y: scale)
  page.draw(with: .mediaBox, to: context)
  context.restoreGState()
  image.unlockFocus()
  let destination = outputDirectory.appendingPathComponent(String(format: "pdf-page-%02d.png", number))
  guard let data = image.tiffRepresentation,
        let bitmap = NSBitmapImageRep(data: data),
        let png = bitmap.representation(using: .png, properties: [:]) else { fatalError("Unable to encode page \(number)") }
  try png.write(to: destination)
  print(destination.path)
}
