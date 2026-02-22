#!/bin/sh
# Generate runtime environment configuration for React app

# Create env-config.js with environment variables
cat > /usr/share/nginx/html/env-config.js << EOF
window._env_ = {
  VITE_API_URL: "${VITE_API_URL:-https://your-api.herokuapp.com/api}",
  VITE_API_TIMEOUT: "${VITE_API_TIMEOUT:-15000}"
};
EOF

echo "Environment configuration generated successfully"
