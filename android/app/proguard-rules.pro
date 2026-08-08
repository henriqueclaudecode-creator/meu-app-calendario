# Regras ProGuard/R8 para o release do Orbit.

# --- Capacitor / plugins ---------------------------------------------------
# Bridge do Capacitor e plugins carregados via reflection (@CapacitorPlugin).
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin public class * { *; }
-keepclassmembers class * extends com.getcapacitor.Plugin { *; }
-keep class * extends com.getcapacitor.Plugin { *; }

# Interfaces JS <-> WebView usam nomes preservados.
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# --- App / Widgets ---------------------------------------------------------
# Receivers e Services de widget são referenciados por nome no AndroidManifest;
# a ofuscação/remoção quebraria os widgets da tela inicial.
-keep class com.orbit.calendario.** { *; }

# --- AndroidX / util --------------------------------------------------------
-keep class androidx.core.app.CoreComponentFactory { *; }
-dontwarn org.slf4j.**

# --- Provedores de login não usados (evita erro de classes ausentes no R8) ---
# O plugin de autenticação referencia Facebook Login, que não incluímos.
-dontwarn com.facebook.**
# RevenueCat traz suporte opcional à Amazon Appstore, que não usamos.
-dontwarn com.amazon.**

# Preserva anotações e nomes necessários a stack traces legíveis no Play Console.
-keepattributes *Annotation*, Signature, InnerClasses, EnclosingMethod
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
