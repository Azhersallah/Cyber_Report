{
  "targets": [
    {
      "target_name": "license_checker",
      "product_dir": "<(module_root_dir)/native_build/Release",
      "sources": [
        "native/license_checker.cpp"
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      "defines": [
        "NAPI_DISABLE_CPP_EXCEPTIONS",
        "NODE_ADDON_API_DISABLE_DEPRECATED"
      ],
      "cflags!": ["-fno-exceptions"],
      "cflags_cc!": ["-fno-exceptions"],
      "cflags_cc": ["-std=c++17", "-O2"],
      "conditions": [
        [
          "OS=='win'",
          {
            "msvs_settings": {
              "VCCLCompilerTool": {
                "ExceptionHandling": 1,
                "AdditionalOptions": ["/std:c++17", "/O2"]
              },
              "VCLinkerTool": {
                "AdditionalOptions": ["/DEBUG:NONE"]
              }
            },
            "libraries": [
              "-liphlpapi.lib"
            ]
          }
        ],
        [
          "OS=='mac'",
          {
            "xcode_settings": {
              "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
              "CLANG_CXX_LANGUAGE_STANDARD": "c++17",
              "MACOSX_DEPLOYMENT_TARGET": "10.15",
              "OTHER_CFLAGS": ["-O2"]
            },
            "libraries": [
              "-framework IOKit",
              "-framework CoreFoundation"
            ]
          }
        ],
        [
          "OS=='linux'",
          {
            "cflags_cc": ["-std=c++17", "-O2", "-fPIC"]
          }
        ]
      ]
    }
  ]
}
