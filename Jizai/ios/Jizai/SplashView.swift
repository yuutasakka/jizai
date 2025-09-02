import SwiftUI

struct SplashView: View {
    @Environment(\.accessibilityReduceMotion) var reduceMotion
    @State private var hide = false
    var onDone: () -> Void = {}

    var body: some View {
        ZStack {
            LinearGradient(colors: [Color(red:0.039,green:0.518,blue:1.0),
                                    Color(red:0.490,green:0.361,blue:1.0)],
                           startPoint: .topLeading, endPoint: .bottomTrailing)
                .ignoresSafeArea()

            VStack(spacing: 20) {
                ZStack {
                    Capsule().fill(Color.white.opacity(0.9)).frame(width: 280, height: 14)
                    Circle().fill(Color.white).frame(width: 44, height: 44)
                        .shadow(color: .black.opacity(0.12), radius: 8, y: 8)
                        .offset(x: reduceMotion ? 0 : 5)
                        .animation(reduceMotion ? nil :
                                   .easeInOut(duration: 1.6).repeatForever(autoreverses: true), value: UUID())
                }
                Text("写真、思いのままに。")
                    .font(.title3)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                    .multilineTextAlignment(.center)
            }
            .padding()
            .background(.ultraThinMaterial.opacity(0.35))
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .opacity(hide ? 0 : 1)
            .animation(.easeOut(duration: 0.5), value: hide)
        }
        .task {
            let seen = UserDefaults.standard.bool(forKey: "jizai.splash.seen")
            let delay: Double = seen ? 0.4 : 0.8
            try? await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
            UserDefaults.standard.set(true, forKey: "jizai.splash.seen")
            hide = true
            try? await Task.sleep(nanoseconds: 300_000_000)
            onDone()
        }
    }
}

struct SplashView_Previews: PreviewProvider {
    static var previews: some View {
        SplashView()
    }
}

