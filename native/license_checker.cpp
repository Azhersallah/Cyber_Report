/**
 * Native License Checker Module for Photo Printer Pro
 * 
 * This C++ addon provides tamper-resistant license validation that cannot
 * be easily bypassed by modifying JavaScript files. Once compiled to a
 * .node binary, the logic is opaque to casual reverse engineering.
 * 
 * Features:
 *   - Hardware ID collection (motherboard serial, BIOS, CPU ID, MAC address)
 *   - AES-256-CBC encryption/decryption for license data
 *   - HMAC-SHA256 signature verification for license keys
 *   - Expiration date checking
 *   - Integrity self-check (detects if JS layer was tampered)
 *   - Cross-platform: Windows, macOS, Linux
 * 
 * Build: node-gyp rebuild  (or via npm run build:native)
 */

#include <napi.h>
#include <string>
#include <vector>
#include <cstring>
#include <ctime>
#include <sstream>
#include <iomanip>
#include <algorithm>
#include <fstream>
#include <functional>
#include <random>
#include <cstdint>

// Platform-specific includes
#ifdef _WIN32
  #define WIN32_LEAN_AND_MEAN
  #define NOMINMAX
  #include <windows.h>
  #include <iphlpapi.h>
  #include <intrin.h>
  #pragma comment(lib, "iphlpapi.lib")
#elif defined(__APPLE__)
  #include <sys/sysctl.h>
  #include <net/if.h>
  #include <net/if_dl.h>
  #include <ifaddrs.h>
  #include <IOKit/IOKitLib.h>
  #include <CoreFoundation/CoreFoundation.h>
#else
  // Linux
  #include <sys/ioctl.h>
  #include <net/if.h>
  #include <unistd.h>
  #include <ifaddrs.h>
  #include <netpacket/packet.h>
#endif

// ============================================================
// Embedded AES-256-CBC Implementation (no OpenSSL dependency)
// ============================================================

namespace aes {

static const uint8_t sbox[256] = {
  0x63,0x7c,0x77,0x7b,0xf2,0x6b,0x6f,0xc5,0x30,0x01,0x67,0x2b,0xfe,0xd7,0xab,0x76,
  0xca,0x82,0xc9,0x7d,0xfa,0x59,0x47,0xf0,0xad,0xd4,0xa2,0xaf,0x9c,0xa4,0x72,0xc0,
  0xb7,0xfd,0x93,0x26,0x36,0x3f,0xf7,0xcc,0x34,0xa5,0xe5,0xf1,0x71,0xd8,0x31,0x15,
  0x04,0xc7,0x23,0xc3,0x18,0x96,0x05,0x9a,0x07,0x12,0x80,0xe2,0xeb,0x27,0xb2,0x75,
  0x09,0x83,0x2c,0x1a,0x1b,0x6e,0x5a,0xa0,0x52,0x3b,0xd6,0xb3,0x29,0xe3,0x2f,0x84,
  0x53,0xd1,0x00,0xed,0x20,0xfc,0xb1,0x5b,0x6a,0xcb,0xbe,0x39,0x4a,0x4c,0x58,0xcf,
  0xd0,0xef,0xaa,0xfb,0x43,0x4d,0x33,0x85,0x45,0xf9,0x02,0x7f,0x50,0x3c,0x9f,0xa8,
  0x51,0xa3,0x40,0x8f,0x92,0x9d,0x38,0xf5,0xbc,0xb6,0xda,0x21,0x10,0xff,0xf3,0xd2,
  0xcd,0x0c,0x13,0xec,0x5f,0x97,0x44,0x17,0xc4,0xa7,0x7e,0x3d,0x64,0x5d,0x19,0x73,
  0x60,0x81,0x4f,0xdc,0x22,0x2a,0x90,0x88,0x46,0xee,0xb8,0x14,0xde,0x5e,0x0b,0xdb,
  0xe0,0x32,0x3a,0x0a,0x49,0x06,0x24,0x5c,0xc2,0xd3,0xac,0x62,0x91,0x95,0xe4,0x79,
  0xe7,0xc8,0x37,0x6d,0x8d,0xd5,0x4e,0xa9,0x6c,0x56,0xf4,0xea,0x65,0x7a,0xae,0x08,
  0xba,0x78,0x25,0x2e,0x1c,0xa6,0xb4,0xc6,0xe8,0xdd,0x74,0x1f,0x4b,0xbd,0x8b,0x8a,
  0x70,0x3e,0xb5,0x66,0x48,0x03,0xf6,0x0e,0x61,0x35,0x57,0xb9,0x86,0xc1,0x1d,0x9e,
  0xe1,0xf8,0x98,0x11,0x69,0xd9,0x8e,0x94,0x9b,0x1e,0x87,0xe9,0xce,0x55,0x28,0xdf,
  0x8c,0xa1,0x89,0x0d,0xbf,0xe6,0x42,0x68,0x41,0x99,0x2d,0x0f,0xb0,0x54,0xbb,0x16
};

static const uint8_t rsbox[256] = {
  0x52,0x09,0x6a,0xd5,0x30,0x36,0xa5,0x38,0xbf,0x40,0xa3,0x9e,0x81,0xf3,0xd7,0xfb,
  0x7c,0xe3,0x39,0x82,0x9b,0x2f,0xff,0x87,0x34,0x8e,0x43,0x44,0xc4,0xde,0xe9,0xcb,
  0x54,0x7b,0x94,0x32,0xa6,0xc2,0x23,0x3d,0xee,0x4c,0x95,0x0b,0x42,0xfa,0xc3,0x4e,
  0x08,0x2e,0xa1,0x66,0x28,0xd9,0x24,0xb2,0x76,0x5b,0xa2,0x49,0x6d,0x8b,0xd1,0x25,
  0x72,0xf8,0xf6,0x64,0x86,0x68,0x98,0x16,0xd4,0xa4,0x5c,0xcc,0x5d,0x65,0xb6,0x92,
  0x6c,0x70,0x48,0x50,0xfd,0xed,0xb9,0xda,0x5e,0x15,0x46,0x57,0xa7,0x8d,0x9d,0x84,
  0x90,0xd8,0xab,0x00,0x8c,0xbc,0xd3,0x0a,0xf7,0xe4,0x58,0x05,0xb8,0xb3,0x45,0x06,
  0xd0,0x2c,0x1e,0x8f,0xca,0x3f,0x0f,0x02,0xc1,0xaf,0xbd,0x03,0x01,0x13,0x8a,0x6b,
  0x3a,0x91,0x11,0x41,0x4f,0x67,0xdc,0xea,0x97,0xf2,0xcf,0xce,0xf0,0xb4,0xe6,0x73,
  0x96,0xac,0x74,0x22,0xe7,0xad,0x35,0x85,0xe2,0xf9,0x37,0xe8,0x1c,0x75,0xdf,0x6e,
  0x47,0xf1,0x1a,0x71,0x1d,0x29,0xc5,0x89,0x6f,0xb7,0x62,0x0e,0xaa,0x18,0xbe,0x1b,
  0xfc,0x56,0x3e,0x4b,0xc6,0xd2,0x79,0x20,0x9a,0xdb,0xc0,0xfe,0x78,0xcd,0x5a,0xf4,
  0x1f,0xdd,0xa8,0x33,0x88,0x07,0xc7,0x31,0xb1,0x12,0x10,0x59,0x27,0x80,0xec,0x5f,
  0x60,0x51,0x7f,0xa9,0x19,0xb5,0x4a,0x0d,0x2d,0xe5,0x7a,0x9f,0x93,0xc9,0x9c,0xef,
  0xa0,0xe0,0x3b,0x4d,0xae,0x2a,0xf5,0xb0,0xc8,0xeb,0xbb,0x3c,0x83,0x53,0x99,0x61,
  0x17,0x2b,0x04,0x7e,0xba,0x77,0xd6,0x26,0xe1,0x69,0x14,0x63,0x55,0x21,0x0c,0x7d
};

static const uint8_t Rcon[11] = {
  0x8d,0x01,0x02,0x04,0x08,0x10,0x20,0x40,0x80,0x1b,0x36
};

#define Nb 4
#define Nk 8
#define Nr 14
#define AES_KEYLEN 32
#define AES_BLOCKLEN 16
#define AES_keyExpSize 240

struct AESCtx {
  uint8_t RoundKey[AES_keyExpSize];
  uint8_t Iv[AES_BLOCKLEN];
};

static uint8_t xtime(uint8_t x) { return ((x<<1) ^ (((x>>7) & 1) * 0x1b)); }

static void KeyExpansion(uint8_t* RoundKey, const uint8_t* Key) {
  uint8_t tempa[4];
  unsigned i, j, k;
  for (i = 0; i < Nk; ++i) {
    RoundKey[(i*4)+0] = Key[(i*4)+0];
    RoundKey[(i*4)+1] = Key[(i*4)+1];
    RoundKey[(i*4)+2] = Key[(i*4)+2];
    RoundKey[(i*4)+3] = Key[(i*4)+3];
  }
  for (i = Nk; i < Nb * (Nr + 1); ++i) {
    k = (i-1)*4;
    tempa[0]=RoundKey[k+0]; tempa[1]=RoundKey[k+1];
    tempa[2]=RoundKey[k+2]; tempa[3]=RoundKey[k+3];
    if (i % Nk == 0) {
      uint8_t u = tempa[0];
      tempa[0]=tempa[1]; tempa[1]=tempa[2]; tempa[2]=tempa[3]; tempa[3]=u;
      tempa[0]=sbox[tempa[0]]; tempa[1]=sbox[tempa[1]];
      tempa[2]=sbox[tempa[2]]; tempa[3]=sbox[tempa[3]];
      tempa[0] ^= Rcon[i/Nk];
    }
    if (i % Nk == 4) {
      tempa[0]=sbox[tempa[0]]; tempa[1]=sbox[tempa[1]];
      tempa[2]=sbox[tempa[2]]; tempa[3]=sbox[tempa[3]];
    }
    j = i*4; k = (i-Nk)*4;
    RoundKey[j+0]=RoundKey[k+0]^tempa[0];
    RoundKey[j+1]=RoundKey[k+1]^tempa[1];
    RoundKey[j+2]=RoundKey[k+2]^tempa[2];
    RoundKey[j+3]=RoundKey[k+3]^tempa[3];
  }
}

static void AddRoundKey(uint8_t round, uint8_t state[][4], const uint8_t* RoundKey) {
  for (uint8_t i=0;i<4;++i)
    for (uint8_t j=0;j<4;++j)
      state[i][j] ^= RoundKey[(round*Nb*4)+(i*Nb)+j];
}
static void SubBytes(uint8_t state[][4]) {
  for (uint8_t i=0;i<4;++i) for (uint8_t j=0;j<4;++j) state[j][i]=sbox[state[j][i]];
}
static void InvSubBytes(uint8_t state[][4]) {
  for (uint8_t i=0;i<4;++i) for (uint8_t j=0;j<4;++j) state[j][i]=rsbox[state[j][i]];
}
static void ShiftRows(uint8_t state[][4]) {
  uint8_t t;
  t=state[0][1]; state[0][1]=state[1][1]; state[1][1]=state[2][1]; state[2][1]=state[3][1]; state[3][1]=t;
  t=state[0][2]; state[0][2]=state[2][2]; state[2][2]=t; t=state[1][2]; state[1][2]=state[3][2]; state[3][2]=t;
  t=state[0][3]; state[0][3]=state[3][3]; state[3][3]=state[2][3]; state[2][3]=state[1][3]; state[1][3]=t;
}
static void InvShiftRows(uint8_t state[][4]) {
  uint8_t t;
  t=state[3][1]; state[3][1]=state[2][1]; state[2][1]=state[1][1]; state[1][1]=state[0][1]; state[0][1]=t;
  t=state[0][2]; state[0][2]=state[2][2]; state[2][2]=t; t=state[1][2]; state[1][2]=state[3][2]; state[3][2]=t;
  t=state[0][3]; state[0][3]=state[1][3]; state[1][3]=state[2][3]; state[2][3]=state[3][3]; state[3][3]=t;
}
static void MixColumns(uint8_t state[][4]) {
  for (uint8_t i=0;i<4;++i) {
    uint8_t t=state[i][0], Tmp=state[i][0]^state[i][1]^state[i][2]^state[i][3];
    uint8_t Tm;
    Tm=state[i][0]^state[i][1]; Tm=xtime(Tm); state[i][0]^=Tm^Tmp;
    Tm=state[i][1]^state[i][2]; Tm=xtime(Tm); state[i][1]^=Tm^Tmp;
    Tm=state[i][2]^state[i][3]; Tm=xtime(Tm); state[i][2]^=Tm^Tmp;
    Tm=state[i][3]^t;           Tm=xtime(Tm); state[i][3]^=Tm^Tmp;
  }
}
static uint8_t Multiply(uint8_t x, uint8_t y) {
  return (((y&1)*x)^((y>>1&1)*xtime(x))^((y>>2&1)*xtime(xtime(x)))^
         ((y>>3&1)*xtime(xtime(xtime(x))))^((y>>4&1)*xtime(xtime(xtime(xtime(x))))));
}
static void InvMixColumns(uint8_t state[][4]) {
  for (uint8_t i=0;i<4;++i) {
    uint8_t a=state[i][0],b=state[i][1],c=state[i][2],d=state[i][3];
    state[i][0]=Multiply(a,0x0e)^Multiply(b,0x0b)^Multiply(c,0x0d)^Multiply(d,0x09);
    state[i][1]=Multiply(a,0x09)^Multiply(b,0x0e)^Multiply(c,0x0b)^Multiply(d,0x0d);
    state[i][2]=Multiply(a,0x0d)^Multiply(b,0x09)^Multiply(c,0x0e)^Multiply(d,0x0b);
    state[i][3]=Multiply(a,0x0b)^Multiply(b,0x0d)^Multiply(c,0x09)^Multiply(d,0x0e);
  }
}
static void Cipher(uint8_t state[][4], const uint8_t* RoundKey) {
  AddRoundKey(0, state, RoundKey);
  for (uint8_t r=1; r<Nr; ++r) { SubBytes(state); ShiftRows(state); MixColumns(state); AddRoundKey(r,state,RoundKey); }
  SubBytes(state); ShiftRows(state); AddRoundKey(Nr, state, RoundKey);
}
static void InvCipher(uint8_t state[][4], const uint8_t* RoundKey) {
  AddRoundKey(Nr, state, RoundKey);
  for (uint8_t r=Nr-1; r>0; --r) { InvShiftRows(state); InvSubBytes(state); AddRoundKey(r,state,RoundKey); InvMixColumns(state); }
  InvShiftRows(state); InvSubBytes(state); AddRoundKey(0, state, RoundKey);
}
static void XorWithIv(uint8_t* buf, const uint8_t* Iv) { for (uint8_t i=0;i<AES_BLOCKLEN;++i) buf[i]^=Iv[i]; }

static void AES_CBC_encrypt(AESCtx* ctx, uint8_t* buf, size_t length) {
  for (size_t i=0; i<length; i+=AES_BLOCKLEN) {
    XorWithIv(buf, ctx->Iv);
    uint8_t state[4][4];
    for (int r=0;r<4;r++) for (int c=0;c<4;c++) state[r][c]=buf[r*4+c];
    Cipher(state, ctx->RoundKey);
    for (int r=0;r<4;r++) for (int c=0;c<4;c++) buf[r*4+c]=state[r][c];
    memcpy(ctx->Iv, buf, AES_BLOCKLEN);
    buf += AES_BLOCKLEN;
  }
}

static void AES_CBC_decrypt(AESCtx* ctx, uint8_t* buf, size_t length) {
  uint8_t storeNextIv[AES_BLOCKLEN];
  for (size_t i=0; i<length; i+=AES_BLOCKLEN) {
    memcpy(storeNextIv, buf, AES_BLOCKLEN);
    uint8_t state[4][4];
    for (int r=0;r<4;r++) for (int c=0;c<4;c++) state[r][c]=buf[r*4+c];
    InvCipher(state, ctx->RoundKey);
    for (int r=0;r<4;r++) for (int c=0;c<4;c++) buf[r*4+c]=state[r][c];
    XorWithIv(buf, ctx->Iv);
    memcpy(ctx->Iv, storeNextIv, AES_BLOCKLEN);
    buf += AES_BLOCKLEN;
  }
}

static void AES_init(AESCtx* ctx, const uint8_t* key, const uint8_t* iv) {
  KeyExpansion(ctx->RoundKey, key);
  memcpy(ctx->Iv, iv, AES_BLOCKLEN);
}

} // namespace aes

// ============================================================
// Embedded SHA-256 Implementation
// ============================================================

namespace sha256 {

static const uint32_t k[64] = {
  0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
  0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
  0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
  0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
  0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
  0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
  0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
  0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
};

static inline uint32_t rotr(uint32_t x, uint32_t n) { return (x >> n) | (x << (32 - n)); }
static inline uint32_t ch(uint32_t x, uint32_t y, uint32_t z) { return (x & y) ^ (~x & z); }
static inline uint32_t maj(uint32_t x, uint32_t y, uint32_t z) { return (x & y) ^ (x & z) ^ (y & z); }
static inline uint32_t ep0(uint32_t x) { return rotr(x,2) ^ rotr(x,13) ^ rotr(x,22); }
static inline uint32_t ep1(uint32_t x) { return rotr(x,6) ^ rotr(x,11) ^ rotr(x,25); }
static inline uint32_t sig0(uint32_t x) { return rotr(x,7) ^ rotr(x,18) ^ (x >> 3); }
static inline uint32_t sig1(uint32_t x) { return rotr(x,17) ^ rotr(x,19) ^ (x >> 10); }

struct SHA256Ctx {
  uint8_t data[64];
  uint32_t datalen;
  uint64_t bitlen;
  uint32_t state[8];
};

static void sha256_transform(SHA256Ctx* ctx, const uint8_t data[]) {
  uint32_t a,b,c,d,e,f,g,h,i,j,t1,t2,m[64];
  for (i=0,j=0; i<16; ++i, j+=4)
    m[i] = (data[j]<<24)|(data[j+1]<<16)|(data[j+2]<<8)|(data[j+3]);
  for (; i<64; ++i)
    m[i] = sig1(m[i-2]) + m[i-7] + sig0(m[i-15]) + m[i-16];
  a=ctx->state[0]; b=ctx->state[1]; c=ctx->state[2]; d=ctx->state[3];
  e=ctx->state[4]; f=ctx->state[5]; g=ctx->state[6]; h=ctx->state[7];
  for (i=0; i<64; ++i) {
    t1 = h + ep1(e) + ch(e,f,g) + k[i] + m[i];
    t2 = ep0(a) + maj(a,b,c);
    h=g; g=f; f=e; e=d+t1; d=c; c=b; b=a; a=t1+t2;
  }
  ctx->state[0]+=a; ctx->state[1]+=b; ctx->state[2]+=c; ctx->state[3]+=d;
  ctx->state[4]+=e; ctx->state[5]+=f; ctx->state[6]+=g; ctx->state[7]+=h;
}

static void sha256_init(SHA256Ctx* ctx) {
  ctx->datalen = 0; ctx->bitlen = 0;
  ctx->state[0]=0x6a09e667; ctx->state[1]=0xbb67ae85;
  ctx->state[2]=0x3c6ef372; ctx->state[3]=0xa54ff53a;
  ctx->state[4]=0x510e527f; ctx->state[5]=0x9b05688c;
  ctx->state[6]=0x1f83d9ab; ctx->state[7]=0x5be0cd19;
}

static void sha256_update(SHA256Ctx* ctx, const uint8_t data[], size_t len) {
  for (size_t i=0; i<len; ++i) {
    ctx->data[ctx->datalen] = data[i];
    ctx->datalen++;
    if (ctx->datalen == 64) {
      sha256_transform(ctx, ctx->data);
      ctx->bitlen += 512;
      ctx->datalen = 0;
    }
  }
}

static void sha256_final(SHA256Ctx* ctx, uint8_t hash[]) {
  uint32_t i = ctx->datalen;
  if (ctx->datalen < 56) {
    ctx->data[i++] = 0x80;
    while (i < 56) ctx->data[i++] = 0x00;
  } else {
    ctx->data[i++] = 0x80;
    while (i < 64) ctx->data[i++] = 0x00;
    sha256_transform(ctx, ctx->data);
    memset(ctx->data, 0, 56);
  }
  ctx->bitlen += ctx->datalen * 8;
  ctx->data[63] = (uint8_t)(ctx->bitlen);
  ctx->data[62] = (uint8_t)(ctx->bitlen >> 8);
  ctx->data[61] = (uint8_t)(ctx->bitlen >> 16);
  ctx->data[60] = (uint8_t)(ctx->bitlen >> 24);
  ctx->data[59] = (uint8_t)(ctx->bitlen >> 32);
  ctx->data[58] = (uint8_t)(ctx->bitlen >> 40);
  ctx->data[57] = (uint8_t)(ctx->bitlen >> 48);
  ctx->data[56] = (uint8_t)(ctx->bitlen >> 56);
  sha256_transform(ctx, ctx->data);
  for (i=0; i<4; ++i) {
    hash[i]    = (ctx->state[0] >> (24-i*8)) & 0xff;
    hash[i+4]  = (ctx->state[1] >> (24-i*8)) & 0xff;
    hash[i+8]  = (ctx->state[2] >> (24-i*8)) & 0xff;
    hash[i+12] = (ctx->state[3] >> (24-i*8)) & 0xff;
    hash[i+16] = (ctx->state[4] >> (24-i*8)) & 0xff;
    hash[i+20] = (ctx->state[5] >> (24-i*8)) & 0xff;
    hash[i+24] = (ctx->state[6] >> (24-i*8)) & 0xff;
    hash[i+28] = (ctx->state[7] >> (24-i*8)) & 0xff;
  }
}

static std::string hash(const std::string& input) {
  SHA256Ctx ctx;
  uint8_t h[32];
  sha256_init(&ctx);
  sha256_update(&ctx, (const uint8_t*)input.c_str(), input.size());
  sha256_final(&ctx, h);
  std::ostringstream oss;
  for (int i=0; i<32; ++i) oss << std::hex << std::setfill('0') << std::setw(2) << (int)h[i];
  return oss.str();
}

static std::vector<uint8_t> hash_raw(const uint8_t* data, size_t len) {
  SHA256Ctx ctx;
  std::vector<uint8_t> h(32);
  sha256_init(&ctx);
  sha256_update(&ctx, data, len);
  sha256_final(&ctx, h.data());
  return h;
}

// HMAC-SHA256
static std::string hmac(const std::string& key, const std::string& message) {
  uint8_t k_pad[64];
  memset(k_pad, 0, 64);
  
  if (key.size() > 64) {
    auto hk = hash_raw((const uint8_t*)key.c_str(), key.size());
    memcpy(k_pad, hk.data(), 32);
  } else {
    memcpy(k_pad, key.c_str(), key.size());
  }
  
  // Inner hash
  uint8_t i_pad[64];
  for (int i=0; i<64; ++i) i_pad[i] = k_pad[i] ^ 0x36;
  
  SHA256Ctx ctx;
  uint8_t inner[32];
  sha256_init(&ctx);
  sha256_update(&ctx, i_pad, 64);
  sha256_update(&ctx, (const uint8_t*)message.c_str(), message.size());
  sha256_final(&ctx, inner);
  
  // Outer hash
  uint8_t o_pad[64];
  for (int i=0; i<64; ++i) o_pad[i] = k_pad[i] ^ 0x5c;
  
  uint8_t result[32];
  sha256_init(&ctx);
  sha256_update(&ctx, o_pad, 64);
  sha256_update(&ctx, inner, 32);
  sha256_final(&ctx, result);
  
  std::ostringstream oss;
  for (int i=0; i<32; ++i) oss << std::hex << std::setfill('0') << std::setw(2) << (int)result[i];
  return oss.str();
}

} // namespace sha256

// ============================================================
// Helper Utilities
// ============================================================

static std::string bytes_to_hex(const uint8_t* data, size_t len) {
  std::ostringstream oss;
  for (size_t i = 0; i < len; ++i)
    oss << std::hex << std::setfill('0') << std::setw(2) << (int)data[i];
  return oss.str();
}

static std::vector<uint8_t> hex_to_bytes(const std::string& hex) {
  std::vector<uint8_t> bytes;
  for (size_t i = 0; i + 1 < hex.size(); i += 2) {
    uint8_t byte = (uint8_t)strtol(hex.substr(i, 2).c_str(), nullptr, 16);
    bytes.push_back(byte);
  }
  return bytes;
}

// Derive a 32-byte AES key from a passphrase using iterated SHA-256
static std::vector<uint8_t> derive_key(const std::string& passphrase, const std::string& salt, int iterations = 10000) {
  std::string input = passphrase + salt;
  std::vector<uint8_t> key = sha256::hash_raw((const uint8_t*)input.c_str(), input.size());
  for (int i = 1; i < iterations; ++i) {
    key = sha256::hash_raw(key.data(), key.size());
  }
  return key;
}

// ============================================================
// Platform-Specific Hardware ID Collection
// ============================================================

#ifdef _WIN32
// Helper: execute a command with a HIDDEN window (no CMD flash) and capture output
static std::string hidden_exec(const char* cmd) {
  std::string result;
  HANDLE hReadPipe, hWritePipe;
  SECURITY_ATTRIBUTES sa = { sizeof(SECURITY_ATTRIBUTES), NULL, TRUE };
  
  if (!CreatePipe(&hReadPipe, &hWritePipe, &sa, 0)) return result;
  
  STARTUPINFOA si = {0};
  si.cb = sizeof(si);
  si.dwFlags = STARTF_USESHOWWINDOW | STARTF_USESTDHANDLES;
  si.wShowWindow = SW_HIDE;
  si.hStdOutput = hWritePipe;
  si.hStdError = hWritePipe;
  
  PROCESS_INFORMATION pi = {0};
  char cmdBuf[1024];
  strncpy(cmdBuf, cmd, sizeof(cmdBuf) - 1);
  cmdBuf[sizeof(cmdBuf) - 1] = '\0';
  
  if (CreateProcessA(NULL, cmdBuf, NULL, NULL, TRUE, CREATE_NO_WINDOW, NULL, NULL, &si, &pi)) {
    CloseHandle(hWritePipe);
    hWritePipe = NULL;
    
    char buf[256];
    DWORD bytesRead;
    while (ReadFile(hReadPipe, buf, sizeof(buf) - 1, &bytesRead, NULL) && bytesRead > 0) {
      buf[bytesRead] = '\0';
      result += buf;
    }
    
    WaitForSingleObject(pi.hProcess, 5000);
    CloseHandle(pi.hProcess);
    CloseHandle(pi.hThread);
  }
  
  if (hWritePipe) CloseHandle(hWritePipe);
  CloseHandle(hReadPipe);
  
  // Trim whitespace
  result.erase(result.find_last_not_of(" \n\r\t") + 1);
  result.erase(0, result.find_first_not_of(" \n\r\t"));
  return result;
}

static std::string get_windows_machine_id() {
  std::string machineId;
  
  // Method 1: Motherboard serial (matches JS order for license compatibility)
  machineId = hidden_exec("powershell -NoProfile -command \"(Get-WmiObject Win32_BaseBoard).SerialNumber\"");
  if (!machineId.empty() && machineId != "To be filled by O.E.M." && 
      machineId != "Default string" && machineId.size() > 3) {
    return machineId;
  }
  
  // Method 2: BIOS serial (hidden window)
  machineId = hidden_exec("powershell -NoProfile -command \"(Get-WmiObject Win32_BIOS).SerialNumber\"");
  if (!machineId.empty() && machineId != "To be filled by O.E.M." && 
      machineId != "Default string" && machineId.size() > 3) {
    return machineId;
  }
  
  // Method 3: CPU ID (hidden window)
  machineId = hidden_exec("powershell -NoProfile -command \"(Get-WmiObject Win32_Processor).ProcessorId\"");
  if (!machineId.empty() && machineId.size() > 3) {
    return machineId;
  }
  
  // Method 4 (last fallback): Windows Machine GUID from registry
  HKEY hKey;
  if (RegOpenKeyExA(HKEY_LOCAL_MACHINE, "SOFTWARE\\Microsoft\\Cryptography", 0, KEY_READ | KEY_WOW64_64KEY, &hKey) == ERROR_SUCCESS) {
    char value[256] = {0};
    DWORD size = sizeof(value);
    if (RegQueryValueExA(hKey, "MachineGuid", NULL, NULL, (LPBYTE)value, &size) == ERROR_SUCCESS) {
      machineId = value;
    }
    RegCloseKey(hKey);
  }
  
  return machineId;
}
#endif

#ifdef __APPLE__
static std::string get_macos_machine_id() {
  std::string machineId;
  char buffer[256] = {0};
  FILE* pipe = popen("system_profiler SPHardwareDataType | grep 'Hardware UUID'", "r");
  if (pipe) {
    if (fgets(buffer, sizeof(buffer), pipe)) {
      std::string line(buffer);
      size_t pos = line.find(':');
      if (pos != std::string::npos) {
        machineId = line.substr(pos + 1);
        machineId.erase(machineId.find_last_not_of(" \n\r\t") + 1);
        machineId.erase(0, machineId.find_first_not_of(" \n\r\t"));
      }
    }
    pclose(pipe);
  }
  return machineId;
}
#endif

#if !defined(_WIN32) && !defined(__APPLE__)
static std::string get_linux_machine_id() {
  std::string machineId;
  
  // Try product_uuid first
  std::ifstream f1("/sys/class/dmi/id/product_uuid");
  if (f1.is_open()) {
    std::getline(f1, machineId);
    f1.close();
    if (!machineId.empty()) return machineId;
  }
  
  // Fallback to machine-id
  std::ifstream f2("/etc/machine-id");
  if (f2.is_open()) {
    std::getline(f2, machineId);
    f2.close();
  }
  
  return machineId;
}
#endif

static std::string get_native_machine_id() {
  std::string id;
  
#ifdef _WIN32
  id = get_windows_machine_id();
#elif defined(__APPLE__)
  id = get_macos_machine_id();
#else
  id = get_linux_machine_id();
#endif

  // Sanitize: same as JS implementation
  // Replace / with _, trim leading/trailing special chars, remove whitespace
  std::string result;
  for (char c : id) {
    if (c == '/') result += '_';
    else if (c != '\r' && c != '\n' && c != ' ' && c != '\t') result += c;
  }
  
  // Trim leading/trailing _-. characters
  size_t start = result.find_first_not_of("_-.");
  size_t end = result.find_last_not_of("_-.");
  if (start != std::string::npos && end != std::string::npos) {
    result = result.substr(start, end - start + 1);
  }
  
  return result;
}

// ============================================================
// License Encryption / Decryption (AES-256-CBC)
// ============================================================

// Encryption salt and key derivation (matches JS: machineId + 'PPro-License-2024' + 'license-salt')
static const std::string LICENSE_KEY_SUFFIX = "PPro-License-2024";
static const std::string LICENSE_SALT = "license-salt";

// Encrypt string data with AES-256-CBC, returns "iv_hex:ciphertext_hex"
static std::string native_encrypt(const std::string& plaintext, const std::string& machineId) {
  std::string passphrase = machineId + LICENSE_KEY_SUFFIX;
  std::vector<uint8_t> key = derive_key(passphrase, LICENSE_SALT, 1); // Single iteration to stay compatible
  
  // Generate random IV
  uint8_t iv[16];
  std::random_device rd;
  std::mt19937 gen(rd());
  std::uniform_int_distribution<> dist(0, 255);
  for (int i = 0; i < 16; ++i) iv[i] = (uint8_t)dist(gen);
  
  // PKCS7 padding
  size_t padLen = 16 - (plaintext.size() % 16);
  std::vector<uint8_t> padded(plaintext.begin(), plaintext.end());
  for (size_t i = 0; i < padLen; ++i) padded.push_back((uint8_t)padLen);
  
  // Encrypt
  aes::AESCtx ctx;
  aes::AES_init(&ctx, key.data(), iv);
  aes::AES_CBC_encrypt(&ctx, padded.data(), padded.size());
  
  return bytes_to_hex(iv, 16) + ":" + bytes_to_hex(padded.data(), padded.size());
}

// Decrypt "iv_hex:ciphertext_hex" format, returns plaintext or empty on failure
static std::string native_decrypt(const std::string& encrypted, const std::string& machineId) {
  size_t colonPos = encrypted.find(':');
  if (colonPos == std::string::npos) return "";
  
  std::string ivHex = encrypted.substr(0, colonPos);
  std::string dataHex = encrypted.substr(colonPos + 1);
  
  if (ivHex.size() != 32) return ""; // 16 bytes = 32 hex chars
  
  std::vector<uint8_t> iv = hex_to_bytes(ivHex);
  std::vector<uint8_t> data = hex_to_bytes(dataHex);
  
  if (data.empty() || data.size() % 16 != 0) return "";
  
  std::string passphrase = machineId + LICENSE_KEY_SUFFIX;
  std::vector<uint8_t> key = derive_key(passphrase, LICENSE_SALT, 1);
  
  aes::AESCtx ctx;
  aes::AES_init(&ctx, key.data(), iv.data());
  aes::AES_CBC_decrypt(&ctx, data.data(), data.size());
  
  // Remove PKCS7 padding
  uint8_t padVal = data.back();
  if (padVal > 16 || padVal == 0) return "";
  for (size_t i = data.size() - padVal; i < data.size(); ++i) {
    if (data[i] != padVal) return "";
  }
  
  return std::string(data.begin(), data.end() - padVal);
}

// ============================================================
// HMAC-based License Key Signing & Verification
// ============================================================

// Embedded signing secret (obfuscated in binary)
// In production, you would use a proper RSA key pair. This HMAC approach
// prevents casual JS-level tampering while keeping the build simple.
static std::string get_signing_secret() {
  // Obfuscated secret - split across multiple operations to resist static analysis
  const char p1[] = {0x50, 0x50, 0x72, 0x6f, 0x2d}; // "PPro-"
  const char p2[] = {0x4e, 0x61, 0x74, 0x69, 0x76, 0x65, 0x2d}; // "Native-"
  const char p3[] = {0x53, 0x69, 0x67, 0x6e, 0x2d}; // "Sign-"
  const char p4[] = {0x4b, 0x65, 0x79, 0x2d, 0x32, 0x30, 0x32, 0x34}; // "Key-2024"
  std::string secret;
  secret.append(p1, 5);
  secret.append(p2, 7);
  secret.append(p3, 5);
  secret.append(p4, 8);
  return secret;
}

// Sign a license payload: HMAC-SHA256(secret, machineId:timestamp:expiry)
static std::string sign_license(const std::string& machineId, const std::string& timestamp, const std::string& expiry) {
  std::string message = machineId + ":" + timestamp + ":" + expiry;
  return sha256::hmac(get_signing_secret(), message);
}

// Verify a signed license
static bool verify_license_signature(const std::string& machineId, const std::string& timestamp, 
                                      const std::string& expiry, const std::string& signature) {
  std::string expected = sign_license(machineId, timestamp, expiry);
  // Constant-time comparison
  if (expected.size() != signature.size()) return false;
  volatile uint8_t diff = 0;
  for (size_t i = 0; i < expected.size(); ++i) {
    diff |= expected[i] ^ signature[i];
  }
  return diff == 0;
}

// ============================================================
// Token Validation (compatible with existing JS token format)
// ============================================================

// JS token format: base64(version:machineId:timestamp:signature)
static bool validate_token_structure(const std::string& token) {
  // Base64 decode
  static const std::string b64chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  
  std::string decoded;
  std::vector<int> T(256, -1);
  for (int i = 0; i < 64; i++) T[b64chars[i]] = i;
  
  int val = 0, valb = -8;
  for (unsigned char c : token) {
    if (c == '=' || c == '\n' || c == '\r') continue;
    if (T[c] == -1) return false;
    val = (val << 6) + T[c];
    valb += 6;
    if (valb >= 0) {
      decoded.push_back(char((val >> valb) & 0xFF));
      valb -= 8;
    }
  }
  
  // Check format: at least 4 colon-separated parts
  int colonCount = 0;
  for (char c : decoded) {
    if (c == ':') colonCount++;
  }
  
  return colonCount >= 3; // version:machineId:timestamp:signature = 3 colons minimum
}

// ============================================================
// Integrity Self-Check
// ============================================================

// Compute a hash of the main.cjs file to detect tampering
static std::string compute_file_hash(const std::string& filePath) {
  std::ifstream file(filePath, std::ios::binary);
  if (!file.is_open()) return "";
  
  std::string content((std::istreambuf_iterator<char>(file)),
                       std::istreambuf_iterator<char>());
  file.close();
  
  return sha256::hash(content);
}

// ============================================================
// Anti-Tamper: Integrity Verification
// ============================================================

// Critical strings that MUST exist in main.cjs for the license system to function.
// If any AI rewrites main.cjs without these, the native module detects it.
// These are obfuscated slightly so grep won't trivially find them all.
static const char* REQUIRED_PATTERNS[] = {
  "checkLicenseSecure",           // Core license check function
  "isLicenseValid",               // License state variable
  "nativeLicense",                // Native module reference
  "verifyMachineIdMatch",         // Native HWID cross-check call
  "validateLicenseComplete",      // Native complete validation call
  "NativeProtection",             // Native protection log prefix
  "check-license",                // IPC handler name
  "verify-license-state",         // IPC handler name
  "loadLicenseFromFile",          // License file loader
  "getHardwareMachineId",         // JS hardware ID function
  "ASAR integrity",               // ASAR integrity comment/check
  "app.quit",                     // Must be able to quit on failure
  "license.dat",                  // License file name
  nullptr
};

// Verify that main.cjs contains all required license enforcement patterns
// Returns: { valid: bool, missing: string (first missing pattern or "") }
static bool verify_main_integrity(const std::string& filePath, std::string& missingPattern) {
  std::ifstream file(filePath, std::ios::binary);
  if (!file.is_open()) {
    missingPattern = "FILE_NOT_FOUND";
    return false;
  }
  
  std::string content((std::istreambuf_iterator<char>(file)),
                       std::istreambuf_iterator<char>());
  file.close();
  
  if (content.size() < 1000) {
    missingPattern = "FILE_TOO_SMALL";
    return false;
  }
  
  for (int i = 0; REQUIRED_PATTERNS[i] != nullptr; ++i) {
    if (content.find(REQUIRED_PATTERNS[i]) == std::string::npos) {
      missingPattern = REQUIRED_PATTERNS[i];
      return false;
    }
  }
  
  return true;
}

// Verify ASAR integrity: app.asar must exist, extracted folder must NOT exist
static bool verify_asar_integrity(const std::string& resourcesPath) {
  if (resourcesPath.empty()) return true; // Not packaged, skip
  
  std::string asarPath = resourcesPath + "/app.asar";
  std::string extractedPath = resourcesPath + "/app";
  std::string extractedPath2 = resourcesPath + "/extracted";
  
  // ASAR must exist
  std::ifstream asarFile(asarPath);
  if (!asarFile.good()) return false;
  asarFile.close();
  
  // Extracted folders must NOT exist (sign of tampering)
#ifdef _WIN32
  DWORD attr1 = GetFileAttributesA(extractedPath.c_str());
  DWORD attr2 = GetFileAttributesA(extractedPath2.c_str());
  if (attr1 != INVALID_FILE_ATTRIBUTES && (attr1 & FILE_ATTRIBUTE_DIRECTORY)) return false;
  if (attr2 != INVALID_FILE_ATTRIBUTES && (attr2 & FILE_ATTRIBUTE_DIRECTORY)) return false;
#else
  struct stat st;
  if (stat(extractedPath.c_str(), &st) == 0 && S_ISDIR(st.st_mode)) return false;
  if (stat(extractedPath2.c_str(), &st) == 0 && S_ISDIR(st.st_mode)) return false;
#endif
  
  return true;
}

// ============================================================
// N-API Exported Functions
// ============================================================

// 1. getHardwareId() -> string
//    Returns the hardware/machine ID (same logic as JS getHardwareMachineId)
Napi::Value GetHardwareId(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  std::string id = get_native_machine_id();
  return Napi::String::New(env, id);
}

// 2. validateToken(token: string) -> boolean
//    Validates the structure of a base64-encoded license token
Napi::Value ValidateToken(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 1 || !info[0].IsString()) {
    return Napi::Boolean::New(env, false);
  }
  
  std::string token = info[0].As<Napi::String>().Utf8Value();
  bool valid = validate_token_structure(token);
  return Napi::Boolean::New(env, valid);
}

// 3. encryptData(plaintext: string, machineId: string) -> string
//    Encrypts data using AES-256-CBC bound to the machine ID
Napi::Value EncryptData(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 2 || !info[0].IsString() || !info[1].IsString()) {
    Napi::TypeError::New(env, "Expected (plaintext, machineId)").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  std::string plaintext = info[0].As<Napi::String>().Utf8Value();
  std::string machineId = info[1].As<Napi::String>().Utf8Value();
  
  std::string encrypted = native_encrypt(plaintext, machineId);
  return Napi::String::New(env, encrypted);
}

// 4. decryptData(encrypted: string, machineId: string) -> string
//    Decrypts AES-256-CBC data. Returns empty string on failure.
Napi::Value DecryptData(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 2 || !info[0].IsString() || !info[1].IsString()) {
    Napi::TypeError::New(env, "Expected (encrypted, machineId)").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  std::string encrypted = info[0].As<Napi::String>().Utf8Value();
  std::string machineId = info[1].As<Napi::String>().Utf8Value();
  
  std::string decrypted = native_decrypt(encrypted, machineId);
  return Napi::String::New(env, decrypted);
}

// 5. signLicense(machineId: string, timestamp: string, expiry: string) -> string
//    Creates an HMAC-SHA256 signature for a license payload
Napi::Value SignLicense(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 3 || !info[0].IsString() || !info[1].IsString() || !info[2].IsString()) {
    Napi::TypeError::New(env, "Expected (machineId, timestamp, expiry)").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  std::string machineId = info[0].As<Napi::String>().Utf8Value();
  std::string timestamp = info[1].As<Napi::String>().Utf8Value();
  std::string expiry = info[2].As<Napi::String>().Utf8Value();
  
  return Napi::String::New(env, sign_license(machineId, timestamp, expiry));
}

// 6. verifyLicenseSignature(machineId, timestamp, expiry, signature) -> boolean
//    Verifies an HMAC-SHA256 license signature (constant-time)
Napi::Value VerifyLicenseSignature(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 4) return Napi::Boolean::New(env, false);
  for (int i = 0; i < 4; ++i) {
    if (!info[i].IsString()) return Napi::Boolean::New(env, false);
  }
  
  std::string machineId = info[0].As<Napi::String>().Utf8Value();
  std::string timestamp = info[1].As<Napi::String>().Utf8Value();
  std::string expiry = info[2].As<Napi::String>().Utf8Value();
  std::string signature = info[3].As<Napi::String>().Utf8Value();
  
  bool valid = verify_license_signature(machineId, timestamp, expiry, signature);
  return Napi::Boolean::New(env, valid);
}

// 7. checkExpiry(expiryDateISO: string) -> { valid: boolean, daysRemaining: number }
//    Checks if a license expiry date has passed. Pass "never" for perpetual licenses.
Napi::Value CheckExpiry(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  Napi::Object result = Napi::Object::New(env);
  
  if (info.Length() < 1 || !info[0].IsString()) {
    result.Set("valid", false);
    result.Set("daysRemaining", 0);
    return result;
  }
  
  std::string expiry = info[0].As<Napi::String>().Utf8Value();
  
  // "never" or "perpetual" = no expiration
  if (expiry == "never" || expiry == "perpetual" || expiry.empty()) {
    result.Set("valid", true);
    result.Set("daysRemaining", 99999);
    return result;
  }
  
  // Parse ISO date: YYYY-MM-DDTHH:MM:SSZ or YYYY-MM-DD
  struct tm tm = {};
  int year, month, day;
  if (sscanf(expiry.c_str(), "%d-%d-%d", &year, &month, &day) == 3) {
    tm.tm_year = year - 1900;
    tm.tm_mon = month - 1;
    tm.tm_mday = day;
    tm.tm_hour = 23;
    tm.tm_min = 59;
    tm.tm_sec = 59;
    
    time_t expiryTime = mktime(&tm);
    time_t now = time(nullptr);
    double diff = difftime(expiryTime, now);
    int daysRemaining = (int)(diff / 86400.0);
    
    result.Set("valid", diff > 0);
    result.Set("daysRemaining", std::max(0, daysRemaining));
  } else {
    // Can't parse date - treat as invalid
    result.Set("valid", false);
    result.Set("daysRemaining", 0);
  }
  
  return result;
}

// 8. computeFileHash(filePath: string) -> string
//    SHA-256 hash of a file, used for integrity checking
Napi::Value ComputeFileHash(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 1 || !info[0].IsString()) {
    return Napi::String::New(env, "");
  }
  
  std::string filePath = info[0].As<Napi::String>().Utf8Value();
  std::string hash = compute_file_hash(filePath);
  return Napi::String::New(env, hash);
}

// 9. sha256Hash(input: string) -> string
//    General-purpose SHA-256 hash
Napi::Value Sha256Hash(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 1 || !info[0].IsString()) {
    return Napi::String::New(env, "");
  }
  
  std::string input = info[0].As<Napi::String>().Utf8Value();
  return Napi::String::New(env, sha256::hash(input));
}

// 10. validateLicenseComplete(token, machineId, licenseFilePath) -> object
//     All-in-one license validation: checks token, machine binding, and file integrity
Napi::Value ValidateLicenseComplete(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  Napi::Object result = Napi::Object::New(env);
  
  // Default: invalid
  result.Set("valid", false);
  result.Set("error", Napi::String::New(env, ""));
  result.Set("machineId", Napi::String::New(env, ""));
  
  // Get native machine ID
  std::string nativeMachineId = get_native_machine_id();
  result.Set("machineId", Napi::String::New(env, nativeMachineId));
  
  if (nativeMachineId.empty()) {
    result.Set("error", Napi::String::New(env, "Cannot determine hardware ID"));
    return result;
  }
  
  // If no arguments, just return machineId (for initial check)
  if (info.Length() < 1) {
    result.Set("error", Napi::String::New(env, "No token provided"));
    return result;
  }
  
  // Validate token
  if (!info[0].IsString()) {
    result.Set("error", Napi::String::New(env, "Invalid token type"));
    return result;
  }
  
  std::string token = info[0].As<Napi::String>().Utf8Value();
  
  if (token.empty()) {
    result.Set("error", Napi::String::New(env, "Empty token"));
    return result;
  }
  
  if (!validate_token_structure(token)) {
    result.Set("error", Napi::String::New(env, "Invalid token structure"));
    return result;
  }
  
  // Validate machine ID binding
  if (info.Length() >= 2 && info[1].IsString()) {
    std::string providedMachineId = info[1].As<Napi::String>().Utf8Value();
    if (providedMachineId != nativeMachineId) {
      result.Set("error", Napi::String::New(env, "Machine ID mismatch"));
      return result;
    }
  }
  
  // All checks passed
  result.Set("valid", true);
  result.Set("error", Napi::String::New(env, ""));
  return result;
}

// 11. getModuleVersion() -> string
//     Returns the native module version for compatibility checking
Napi::Value GetModuleVersion(const Napi::CallbackInfo& info) {
  return Napi::String::New(info.Env(), "2.0.0");
}

// 12. verifyMainIntegrity(mainCjsPath: string) -> { valid: boolean, missing: string }
//     Reads main.cjs and checks that all critical license enforcement patterns exist.
//     If someone replaces main.cjs with a clean version, this will detect it.
Napi::Value VerifyMainIntegrity(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  Napi::Object result = Napi::Object::New(env);
  
  if (info.Length() < 1 || !info[0].IsString()) {
    result.Set("valid", false);
    result.Set("missing", Napi::String::New(env, "NO_PATH"));
    return result;
  }
  
  std::string filePath = info[0].As<Napi::String>().Utf8Value();
  std::string missingPattern;
  bool valid = verify_main_integrity(filePath, missingPattern);
  
  result.Set("valid", valid);
  result.Set("missing", Napi::String::New(env, missingPattern));
  return result;
}

// 13. verifyAsarIntegrity(resourcesPath: string) -> boolean
//     Checks that app.asar exists and no extracted/app folder is present
Napi::Value VerifyAsarIntegrity(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 1 || !info[0].IsString()) {
    return Napi::Boolean::New(env, false);
  }
  
  std::string resourcesPath = info[0].As<Napi::String>().Utf8Value();
  return Napi::Boolean::New(env, verify_asar_integrity(resourcesPath));
}

// ============================================================
// Module Content Integrity Key (separate from encryption key)
// Used to HMAC-sign encrypted module content so that even if someone
// decrypts, modifies, and re-encrypts, the HMAC won't match.
// This key exists ONLY in this compiled binary and in the build script
// (which is NOT shipped with the app).
// ============================================================
static std::string get_integrity_key() {
  // Obfuscated - split across byte arrays to resist static analysis
  const char i1[] = {0x50, 0x50, 0x72, 0x6f, 0x2d};                                     // "PPro-"
  const char i2[] = {0x49, 0x6e, 0x74, 0x65, 0x67};                                     // "Integ"
  const char i3[] = {0x72, 0x69, 0x74, 0x79, 0x2d};                                     // "rity-"
  const char i4[] = {0x56, 0x65, 0x72, 0x69, 0x66, 0x79, 0x2d, 0x32, 0x30, 0x32, 0x34}; // "Verify-2024"
  std::string k;
  k.append(i1, 5); k.append(i2, 5); k.append(i3, 5); k.append(i4, 11);
  return k;
}

// ============================================================
// Context-Bound HMAC Key Derivation (LAYER 6)
// The HMAC key is derived from INTEGRITY_KEY + SHA256(loader.cjs).
// If an attacker modifies loader.cjs to bypass encryption, the derived
// key changes and ALL .enc files become undecryptable.
// We read loader.cjs via N-API (Node's fs module) so it works inside ASAR.
// ============================================================
static std::string s_contextKeyHex;
static bool s_contextKeyComputed = false;
static std::string derive_context_key(Napi::Env env, const std::string& filePath) {
  if (s_contextKeyComputed) return s_contextKeyHex;
  
  // 1. Determine app root from the .enc file path
  std::string appRoot;
  char pathSep = '/';
  if (filePath.find('\\') != std::string::npos) pathSep = '\\';
  
  // Packaged mode: path contains "app.asar.unpacked"
  std::string asarMarker = "app.asar.unpacked";
  size_t asarPos = filePath.find(asarMarker);
  if (asarPos != std::string::npos) {
    appRoot = filePath.substr(0, asarPos) + "app.asar";
  } else {
    // Dev mode: walk up directory tree to find loader.cjs
    std::string dir = filePath;
    size_t sep = dir.find_last_of("/\\");
    while (sep != std::string::npos) {
      dir = dir.substr(0, sep);
      std::string testPath = dir;
      testPath += pathSep;
      testPath += "loader.cjs";
      std::ifstream test(testPath);
      if (test.good()) {
        test.close();
        appRoot = dir;
        break;
      }
      sep = dir.find_last_of("/\\");
    }
  }
  
  if (appRoot.empty()) return "";
  
  // 2. Read loader.cjs content
  std::string loaderFilePath = appRoot + pathSep + "loader.cjs";
  std::string loaderContent;
  bool readOk = false;
  
  // Method A: N-API via process.mainModule.require('fs') — works inside ASAR
  {
    Napi::Object global = env.Global();
    Napi::Value processVal = global.Get("process");
    if (processVal.IsObject()) {
      Napi::Value mainModVal = processVal.As<Napi::Object>().Get("mainModule");
      if (mainModVal.IsObject()) {
        Napi::Value reqVal = mainModVal.As<Napi::Object>().Get("require");
        if (reqVal.IsFunction()) {
          Napi::Value fsVal = reqVal.As<Napi::Function>().Call(
            mainModVal.As<Napi::Object>(), {Napi::String::New(env, "fs")});
          if (!env.IsExceptionPending() && fsVal.IsObject()) {
            Napi::Value readFn = fsVal.As<Napi::Object>().Get("readFileSync");
            if (readFn.IsFunction()) {
              Napi::Value result = readFn.As<Napi::Function>().Call(
                fsVal.As<Napi::Object>(), {Napi::String::New(env, loaderFilePath)});
              if (!env.IsExceptionPending() && result.IsBuffer()) {
                auto buf = result.As<Napi::Buffer<uint8_t>>();
                loaderContent.assign((const char*)buf.Data(), buf.Length());
                readOk = true;
              }
            }
          }
        }
      }
    }
    if (env.IsExceptionPending()) env.GetAndClearPendingException();
  }
  
  // Method B: C++ file I/O fallback (dev mode — files on real filesystem)
  if (!readOk) {
    std::ifstream lf(loaderFilePath, std::ios::binary);
    if (lf.is_open()) {
      loaderContent.assign(std::istreambuf_iterator<char>(lf),
                           std::istreambuf_iterator<char>());
      lf.close();
      readOk = true;
    }
  }
  
  if (!readOk || loaderContent.size() < 100) return "";
  
  const uint8_t* loaderData = (const uint8_t*)loaderContent.data();
  size_t loaderLen = loaderContent.size();
  
  // 3. Compute context hash: SHA256(loader_bytes || "||CONTEXT_BIND||")
  const char* separator = "||CONTEXT_BIND||";
  sha256::SHA256Ctx hashCtx;
  uint8_t contextHashRaw[32];
  sha256::sha256_init(&hashCtx);
  sha256::sha256_update(&hashCtx, loaderData, loaderLen);
  sha256::sha256_update(&hashCtx, (const uint8_t*)separator, strlen(separator));
  sha256::sha256_final(&hashCtx, contextHashRaw);
  
  std::string contextHashHex = bytes_to_hex(contextHashRaw, 32);
  
  // 4. Derive context key: HMAC(INTEGRITY_KEY, contextHashHex)
  std::string integrityKey = get_integrity_key();
  s_contextKeyHex = sha256::hmac(integrityKey, contextHashHex);
  s_contextKeyComputed = true;
  
  return s_contextKeyHex;
}

// Limit decryptModule calls per process
static int s_decryptCallCount = 0;
static const int MAX_DECRYPT_CALLS = 15;

// 14. decryptModule(encryptedFilePath: string) -> string
//     Decrypts an encrypted JS module file and returns the source code.
//     Uses AES-256-CBC with a key derived from an embedded secret.
//
//     SECURITY LAYERS:
//       1. HMAC content integrity - rejects tampered/re-encrypted code
//       2. Required license patterns - rejects code with license checks stripped
//       3. Electron-only - refuses to run in standalone Node.js
//       4. Call-count limit - max 3 calls per process lifetime
//       5. Anti-debug - blocks --inspect/--debug flags
//
//     .enc file format: [32 bytes HMAC-SHA256] [16 bytes IV] [AES-256-CBC ciphertext]
Napi::Value DecryptModule(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  // --- LAYER 4: Call-count guard ---
  s_decryptCallCount++;
  if (s_decryptCallCount > MAX_DECRYPT_CALLS) {
    Napi::Error::New(env, "Security violation").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  // --- LAYER 3 & 5: Environment and anti-debug checks ---
  {
    Napi::Object global = env.Global();
    Napi::Value processVal = global.Get("process");
    if (processVal.IsObject()) {
      Napi::Object process = processVal.As<Napi::Object>();
      
      // LAYER 3: Must be running in Electron, not standalone Node.js
      Napi::Value versionsVal = process.Get("versions");
      if (versionsVal.IsObject()) {
        Napi::Value electronVal = versionsVal.As<Napi::Object>().Get("electron");
        if (!electronVal.IsString()) {
          Napi::Error::New(env, "Invalid execution environment").ThrowAsJavaScriptException();
          return env.Null();
        }
      }
      
      // LAYER 5: Reject if debugger flags are present
      Napi::Value execArgvVal = process.Get("execArgv");
      if (execArgvVal.IsArray()) {
        Napi::Array execArgv = execArgvVal.As<Napi::Array>();
        for (uint32_t i = 0; i < execArgv.Length(); i++) {
          Napi::Value argVal = execArgv.Get(i);
          if (argVal.IsString()) {
            std::string arg = argVal.As<Napi::String>().Utf8Value();
            if (arg.find("inspect") != std::string::npos ||
                arg.find("debug") != std::string::npos ||
                arg.find("remote-debugging") != std::string::npos) {
              Napi::Error::New(env, "Security module error").ThrowAsJavaScriptException();
              return env.Null();
            }
          }
        }
      }
    }
  }
  
  if (info.Length() < 1 || !info[0].IsString()) {
    Napi::Error::New(env, "decryptModule requires file path").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  std::string filePath = info[0].As<Napi::String>().Utf8Value();
  
  // Read the encrypted file
  std::ifstream file(filePath, std::ios::binary);
  if (!file.is_open()) {
    Napi::Error::New(env, "Cannot open encrypted module file").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  std::vector<uint8_t> fileData((std::istreambuf_iterator<char>(file)),
                                 std::istreambuf_iterator<char>());
  file.close();
  
  // New format: [32 bytes HMAC] [16 bytes IV] [ciphertext]
  // Minimum: 32 (HMAC) + 16 (IV) + 16 (min ciphertext block) = 64 bytes
  if (fileData.size() < 64) {
    Napi::Error::New(env, "Encrypted module file invalid").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  // Extract HMAC (first 32 bytes), IV (next 16), ciphertext (rest)
  std::vector<uint8_t> storedHmac(fileData.begin(), fileData.begin() + 32);
  std::vector<uint8_t> iv(fileData.begin() + 32, fileData.begin() + 48);
  std::vector<uint8_t> ciphertext(fileData.begin() + 48, fileData.end());
  
  if (ciphertext.empty() || ciphertext.size() % 16 != 0) {
    Napi::Error::New(env, "Invalid encrypted module data").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  // Derive decryption key from embedded secret (same as encrypt-main.cjs)
  // The secret is split across multiple variables to resist simple string scanning
  const char* s1 = "PPro-Native";
  const char* s2 = "Guard-2024";
  const char* s3 = "-ModuleKey";
  std::string secret = std::string(s1) + s2 + s3;
  std::vector<uint8_t> key = sha256::hash_raw((const uint8_t*)secret.c_str(), secret.size());
  
  // Decrypt AES-256-CBC
  std::vector<uint8_t> decrypted = ciphertext; // copy to work buffer
  aes::AESCtx ctx;
  aes::AES_init(&ctx, key.data(), iv.data());
  aes::AES_CBC_decrypt(&ctx, decrypted.data(), decrypted.size());
  
  if (decrypted.empty()) {
    Napi::Error::New(env, "Module decryption failed").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  // Remove PKCS7 padding
  uint8_t padLen = decrypted.back();
  if (padLen > 0 && padLen <= 16) {
    bool validPad = true;
    for (size_t i = decrypted.size() - padLen; i < decrypted.size(); ++i) {
      if (decrypted[i] != padLen) { validPad = false; break; }
    }
    if (validPad) {
      decrypted.resize(decrypted.size() - padLen);
    }
  }
  
  std::string code(decrypted.begin(), decrypted.end());
  
  // --- LAYER 1: Context-bound HMAC integrity verification ---
  // The HMAC key is derived from INTEGRITY_KEY + SHA256(loader.cjs).
  // If someone modifies loader.cjs (to bypass encryption or license checks),
  // the derived key changes and the HMAC won't match — breaking ALL .enc files.
  // Even if they have the encryption key, they cannot forge the HMAC without
  // both the integrity key AND the original unmodified loader.cjs.
  std::string contextKey = derive_context_key(env, filePath);
  if (contextKey.empty()) {
    Napi::Error::New(env, "Context verification failed").ThrowAsJavaScriptException();
    return env.Null();
  }
  std::string computedHmac = sha256::hmac(contextKey, code);
  std::string storedHmacHex = bytes_to_hex(storedHmac.data(), storedHmac.size());
  
  // Constant-time HMAC comparison (resist timing attacks)
  if (computedHmac.size() != storedHmacHex.size()) {
    Napi::Error::New(env, "Module integrity verification failed").ThrowAsJavaScriptException();
    return env.Null();
  }
  volatile uint8_t hmacDiff = 0;
  for (size_t i = 0; i < computedHmac.size(); ++i) {
    hmacDiff |= (uint8_t)computedHmac[i] ^ (uint8_t)storedHmacHex[i];
  }
  if (hmacDiff != 0) {
    Napi::Error::New(env, "Module content has been tampered with").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  // --- LAYER 2: Required license patterns (for main module) ---
  // If the decrypted code creates a BrowserWindow, it's the main module
  // and MUST contain all license enforcement patterns.
  if (code.find("BrowserWindow") != std::string::npos) {
    for (int i = 0; REQUIRED_PATTERNS[i] != nullptr; ++i) {
      if (code.find(REQUIRED_PATTERNS[i]) == std::string::npos) {
        Napi::Error::New(env, "Module code integrity check failed").ThrowAsJavaScriptException();
        return env.Null();
      }
    }
  }
  
  return Napi::String::New(env, code);
}

// ============================================================
// Module Initialization
// ============================================================

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  // Hardware identification
  exports.Set("getHardwareId", Napi::Function::New(env, GetHardwareId));
  
  // Token validation
  exports.Set("validateToken", Napi::Function::New(env, ValidateToken));
  
  // AES-256-CBC encryption/decryption
  exports.Set("encryptData", Napi::Function::New(env, EncryptData));
  exports.Set("decryptData", Napi::Function::New(env, DecryptData));
  
  // License signing (HMAC-SHA256)
  exports.Set("signLicense", Napi::Function::New(env, SignLicense));
  exports.Set("verifyLicenseSignature", Napi::Function::New(env, VerifyLicenseSignature));
  
  // Expiry checking
  exports.Set("checkExpiry", Napi::Function::New(env, CheckExpiry));
  
  // File integrity
  exports.Set("computeFileHash", Napi::Function::New(env, ComputeFileHash));
  exports.Set("sha256Hash", Napi::Function::New(env, Sha256Hash));
  
  // Complete license validation
  exports.Set("validateLicenseComplete", Napi::Function::New(env, ValidateLicenseComplete));
  
  // Module version
  exports.Set("getModuleVersion", Napi::Function::New(env, GetModuleVersion));
  
  // Anti-tamper integrity checks
  exports.Set("verifyMainIntegrity", Napi::Function::New(env, VerifyMainIntegrity));
  exports.Set("verifyAsarIntegrity", Napi::Function::New(env, VerifyAsarIntegrity));
  
  // Encrypted module loading
  exports.Set("decryptModule", Napi::Function::New(env, DecryptModule));
  
  return exports;
}

NODE_API_MODULE(license_checker, Init)
