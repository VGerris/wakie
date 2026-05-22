const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withFixRCTHost(config) {
  return withDangerousMod(config, [
    'ios',
    async (cfg) => {
      const root = cfg.modRequest.platformProjectRoot;

      // === 1. FIX RCTHost.h: Remove JSRuntimeFactory.h import ===
      const rctHost = path.join(
        root,
        'Pods',
        'Headers',
        'Public',
        'ReactCommon',
        'react',
        'renderer',
        'components',
        'rncore',
        'RCTHost.h'
      );
      if (fs.existsSync(rctHost)) {
        let content = await fs.promises.readFile(rctHost, 'utf-8');
        if (content.includes('#import <react/runtime/JSRuntimeFactory.h>')) {
          content = content.replace('#import <react/runtime/JSRuntimeFactory.h>\n', '');
          await fs.promises.writeFile(rctHost, content);
        }
      }

      // === 2. ADD HEADER_SEARCH_PATHS TO EXISTING post_install ===
      const podfilePath = path.join(root, 'Podfile');
      if (!fs.existsSync(podfilePath)) return cfg;

      let podfile = await fs.promises.readFile(podfilePath, 'utf-8');

      const headerPath = '$(PODS_ROOT)/Headers/Public';
      const newCode = `
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      config.build_settings['HEADER_SEARCH_PATHS'] ||= ['$(inherited)']
      config.build_settings['HEADER_SEARCH_PATHS'] << '${headerPath}'
    end
  end
`.trim();

      // Find existing post_install
      const postInstallMatch = podfile.match(/post_install do \|installer\|([\s\S]*?)end/);
      if (postInstallMatch) {
        const existingBody = postInstallMatch[1].trim();
        if (!existingBody.includes(headerPath)) {
          const updatedBody = `${existingBody}\n\n${newCode}`;
          podfile = podfile.replace(postInstallMatch[0], `post_install do |installer|\n${updatedBody}\nend`);
        }
      } else {
        // No post_install → add one
        podfile = `${podfile.trim()}\n\npost_install do |installer|\n${newCode}\nend`;
      }

      await fs.promises.writeFile(podfilePath, podfile);
      return cfg;
    },
  ]);
};