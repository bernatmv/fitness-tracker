import {
  HexToRgb,
  RgbToHex,
  LightenColor,
  DarkenColor,
  GetColorForValue,
  IsValidHexColor,
} from '../color_utils';

describe('color_utils', () => {
  describe('HexToRgb', () => {
    it('should convert hex to RGB correctly', () => {
      expect(HexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
      expect(HexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
      expect(HexToRgb('#40c463')).toEqual({ r: 64, g: 196, b: 99 });
    });

    it('should handle hex without #', () => {
      expect(HexToRgb('ffffff')).toEqual({ r: 255, g: 255, b: 255 });
    });

    it('should return null for invalid hex', () => {
      expect(HexToRgb('invalid')).toBeNull();
      expect(HexToRgb('#xyz')).toBeNull();
    });
  });

  describe('RgbToHex', () => {
    it('should convert RGB to hex correctly', () => {
      expect(RgbToHex(255, 255, 255)).toBe('#ffffff');
      expect(RgbToHex(0, 0, 0)).toBe('#000000');
      expect(RgbToHex(64, 196, 99)).toBe('#40c463');
    });
  });

  describe('LightenColor', () => {
    it('should lighten a color by percentage', () => {
      const lightened = LightenColor('#40c463', 20);
      expect(lightened).toBeTruthy();
      expect(IsValidHexColor(lightened)).toBe(true);
    });

    it('should not exceed max RGB values', () => {
      const lightened = LightenColor('#ffffff', 50);
      expect(lightened).toBe('#ffffff');
    });
  });

  describe('DarkenColor', () => {
    it('should darken a color by percentage', () => {
      const darkened = DarkenColor('#40c463', 20);
      expect(darkened).toBeTruthy();
      expect(IsValidHexColor(darkened)).toBe(true);
    });

    it('should not go below min RGB values', () => {
      const darkened = DarkenColor('#000000', 50);
      expect(darkened).toBe('#000000');
    });
  });

  describe('GetColorForValue', () => {
    // When thresholds include Infinity, the "last bucket" is the range
    // [thresholds[thresholds.length - 2], Infinity) which maps to colors[colors.length - 2].
    const thresholds = [0, 100, 200, 300, Infinity];
    const colors = ['#color1', '#color2', '#color3', '#color4', '#color5'];

    it('should return correct color for value in range', () => {
      expect(GetColorForValue(50, thresholds, colors)).toBe('#color1');
      expect(GetColorForValue(150, thresholds, colors)).toBe('#color2');
      expect(GetColorForValue(250, thresholds, colors)).toBe('#color3');
      expect(GetColorForValue(350, thresholds, colors)).toBe('#color4');
    });

    it('should return last color for values >= last threshold', () => {
      expect(GetColorForValue(1000, thresholds, colors)).toBe('#color4');
    });

    it('should handle edge values correctly', () => {
      expect(GetColorForValue(0, thresholds, colors)).toBe('#color1');
      expect(GetColorForValue(100, thresholds, colors)).toBe('#color2');
      expect(GetColorForValue(200, thresholds, colors)).toBe('#color3');
    });
  });

  describe('IsValidHexColor', () => {
    it('should validate correct hex colors', () => {
      expect(IsValidHexColor('#ffffff')).toBe(true);
      expect(IsValidHexColor('#000000')).toBe(true);
      expect(IsValidHexColor('#40c463')).toBe(true);
      expect(IsValidHexColor('ffffff')).toBe(true);
    });

    it('should reject invalid hex colors', () => {
      expect(IsValidHexColor('invalid')).toBe(false);
      expect(IsValidHexColor('#xyz')).toBe(false);
      expect(IsValidHexColor('#ff')).toBe(false);
      expect(IsValidHexColor('')).toBe(false);
    });
  });
});
