// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "StorefrontCore",
    platforms: [
        .iOS(.v15),
        .macOS(.v13),
    ],
    products: [
        .library(
            name: "StorefrontCore",
            targets: ["StorefrontCore"]
        ),
    ],
    targets: [
        .target(
            name: "StorefrontCore"
        ),
        .testTarget(
            name: "StorefrontCoreTests",
            dependencies: ["StorefrontCore"]
        ),
    ]
)
