const { withGradleProperties } = require('@expo/config-plugins');

const PROPERTIES = [
  {
    key: 'org.gradle.jvmargs',
    value:
      '-Xmx6144m -XX:MaxMetaspaceSize=1g -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8',
  },
  {
    key: 'kotlin.daemon.jvmargs',
    value: '-Xmx4096m -XX:MaxMetaspaceSize=1g -Dfile.encoding=UTF-8',
  },
  {
    key: 'org.gradle.workers.max',
    value: '2',
  },
  {
    key: 'org.gradle.parallel',
    value: 'false',
  },
];

function upsert(items, key, value) {
  const existing = items.find(
    (item) => item.type === 'property' && item.key === key,
  );
  if (existing) {
    existing.value = value;
  } else {
    items.push({ type: 'property', key, value });
  }
  return items;
}

module.exports = function withGradleTuning(config) {
  return withGradleProperties(config, (cfg) => {
    for (const { key, value } of PROPERTIES) {
      cfg.modResults = upsert(cfg.modResults, key, value);
    }
    return cfg;
  });
};
