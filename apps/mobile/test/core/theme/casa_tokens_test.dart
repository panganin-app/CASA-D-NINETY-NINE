import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:casa_resident/core/theme/casa_tokens.dart';

void main() {
  test('casa_tokens.dart dihasilkan BENAR dari packages/design_tokens/tokens.json', () {
    expect(CasaTokens.colorBrandNavy, const Color(0xFF0B3568));
    expect(CasaTokens.spacing4, 16.0);
    expect(CasaTokens.radiusPill, 999.0);
    expect(CasaTokens.fontWeightBold, 700);
    expect(CasaTokens.motionNormal, const Duration(milliseconds: 200));
    expect(CasaTokens.layoutTouchTargetMin, 48.0);
    expect(CasaTokens.elevationCard.blurRadius, 24.0);
  });
}
