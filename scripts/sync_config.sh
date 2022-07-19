cd "$(dirname "$0")"

CONFIG_URL="https://github.com/base9-theme/base9-builder/raw/master/src/default_config.yml"
curl -L $CONFIG_URL | npx js-yaml > ../src/default_config.json
