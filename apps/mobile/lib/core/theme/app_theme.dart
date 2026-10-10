import 'package:flutter/material.dart';
import 'casa_tokens.dart';

FontWeight _weight(int value) {
  switch (value) {
    case 700:
      return FontWeight.w700;
    case 600:
      return FontWeight.w600;
    case 500:
      return FontWeight.w500;
    default:
      return FontWeight.w400;
  }
}

class AppTheme {
  AppTheme._();

  static ThemeData get light {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: CasaTokens.colorBrandNavy,
      primary: CasaTokens.colorBrandNavy,
      secondary: CasaTokens.colorBrandGold,
      error: CasaTokens.colorSemanticError,
      surface: CasaTokens.colorSurfacePrimary,
      brightness: Brightness.light,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: CasaTokens.colorSurfaceCanvas,
      fontFamily: 'Inter',
      textTheme: TextTheme(
        headlineMedium: TextStyle(
          fontSize: CasaTokens.fontSizeXl,
          fontWeight: _weight(CasaTokens.fontWeightBold),
          color: CasaTokens.colorTextPrimary,
        ),
        titleLarge: TextStyle(
          fontSize: CasaTokens.fontSizeLg,
          fontWeight: _weight(CasaTokens.fontWeightSemibold),
          color: CasaTokens.colorTextPrimary,
        ),
        bodyMedium: TextStyle(
          fontSize: CasaTokens.fontSizeMd,
          fontWeight: _weight(CasaTokens.fontWeightRegular),
          color: CasaTokens.colorTextPrimary,
        ),
        bodySmall: TextStyle(
          fontSize: CasaTokens.fontSizeSm,
          fontWeight: _weight(CasaTokens.fontWeightRegular),
          color: CasaTokens.colorTextSecondary,
        ),
        labelLarge: TextStyle(
          fontSize: CasaTokens.fontSizeMd,
          fontWeight: _weight(CasaTokens.fontWeightMedium),
          color: CasaTokens.colorTextInverse,
        ),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: CasaTokens.colorSurfacePrimary,
        foregroundColor: CasaTokens.colorTextPrimary,
        elevation: 0,
        centerTitle: false,
      ),
      cardTheme: CardThemeData(
        color: CasaTokens.colorSurfacePrimary,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(CasaTokens.radiusLg),
          side: BorderSide(color: CasaTokens.colorBorderDefault),
        ),
        margin: EdgeInsets.zero,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: CasaTokens.colorBrandNavy,
          foregroundColor: CasaTokens.colorTextInverse,
          minimumSize: Size.fromHeight(CasaTokens.layoutTouchTargetMin),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(CasaTokens.radiusMd),
          ),
          textStyle: TextStyle(
            fontSize: CasaTokens.fontSizeMd,
            fontWeight: _weight(CasaTokens.fontWeightSemibold),
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: CasaTokens.colorSurfaceSubtle,
        contentPadding: EdgeInsets.symmetric(
          horizontal: CasaTokens.spacing4,
          vertical: CasaTokens.spacing3,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(CasaTokens.radiusMd),
          borderSide: BorderSide(color: CasaTokens.colorBorderDefault),
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: CasaTokens.colorSurfacePrimary,
        indicatorColor: CasaTokens.colorSurfaceSubtle,
        labelTextStyle: WidgetStateProperty.all(
          TextStyle(fontSize: CasaTokens.fontSizeXs, color: CasaTokens.colorTextPrimary),
        ),
      ),
    );
  }
}
