#include <emscripten.h>
#include <stdlib.h>
#include <stdint.h>

inline uint16_t swap_uint16(uint16_t val)
{
  return (val << 8) | (val >> 8);
}

inline uint32_t swap_uint32(uint32_t val)
{
  val = ((val << 8) & 0xFF00FF00) | ((val >> 8) & 0xFF00FF);
  return (val << 16) | (val >> 16);
}

inline uint64_t swap_uint64(uint64_t val)
{
  val = ((val << 8) & 0xFF00FF00FF00FF00ULL) | ((val >> 8) & 0x00FF00FF00FF00FFULL);
  val = ((val << 16) & 0xFFFF0000FFFF0000ULL) | ((val >> 16) & 0x0000FFFF0000FFFFULL);
  return (val << 32) | (val >> 32);
}

template <typename S, typename D>
void convert_array(S *src, D *dst, uint32_t n, double bscale, double bzero)
{
  for (uint32_t i = 0; i < n; ++i)
  {
    *dst++ = bscale * (*src++) + bzero;
  }
}

#define MAKE_CONVERT(S, D)                                                          \
  EMSCRIPTEN_KEEPALIVE                                                              \
  void convert_array_##S##_##D(S *s, D *d, uint32_t n, double bscale, double bzero) \
  {                                                                                 \
    convert_array(s, d, n, bscale, bzero);                                          \
  }

extern "C"

{
  EMSCRIPTEN_KEEPALIVE
  void byteswap16(uint16_t *src, int npix)
  {
    for (auto end = src + npix; src != end; src++)
      *src = swap_uint16(*src);
  }

  EMSCRIPTEN_KEEPALIVE
  void byteswap32(uint32_t *src, int npix)
  {
    for (auto end = src + npix; src != end; src++)
      *src = swap_uint32(*src);
  }

  EMSCRIPTEN_KEEPALIVE
  void byteswap64(uint64_t *src, int npix)
  {
    for (auto end = src + npix; src != end; src++)
      *src = swap_uint64(*src);
  }

  MAKE_CONVERT(double, double) // -> convert_array_double_double
  MAKE_CONVERT(double, float)
  MAKE_CONVERT(double, uint32_t)
  MAKE_CONVERT(double, uint16_t)
  MAKE_CONVERT(double, uint8_t)
  MAKE_CONVERT(float, double)
  MAKE_CONVERT(float, float)
  MAKE_CONVERT(float, uint32_t)
  MAKE_CONVERT(float, uint16_t)
  MAKE_CONVERT(float, uint8_t)
  MAKE_CONVERT(uint16_t, double)
  MAKE_CONVERT(uint16_t, float)
  MAKE_CONVERT(uint16_t, uint32_t)
  MAKE_CONVERT(uint16_t, uint16_t)
  MAKE_CONVERT(uint16_t, uint8_t)
  MAKE_CONVERT(uint8_t, double)
  MAKE_CONVERT(uint8_t, float)
  MAKE_CONVERT(uint8_t, uint32_t)
  MAKE_CONVERT(uint8_t, uint16_t)
  MAKE_CONVERT(uint8_t, uint8_t)
}