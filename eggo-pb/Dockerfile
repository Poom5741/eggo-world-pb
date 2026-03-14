FROM docker.io/alpine:latest

LABEL maintainer="eggo-team"
LABEL description="PocketBase with LINE OAuth and auto wallet generation for eggo-pb"

# Set default PocketBase version (use latest stable with admin UI)
ARG POCKETBASE_VERSION=0.23.4

# Install dependencies
RUN apk add --no-cache \
    curl \
    unzip \
    ca-certificates

# Create directories
RUN mkdir -p /pb /pb_data /pb_hooks /pb_public /pb_migrations

# Download and install PocketBase (ARM64 for Apple Silicon)
RUN curl -L "https://github.com/pocketbase/pocketbase/releases/download/v${POCKETBASE_VERSION}/pocketbase_${POCKETBASE_VERSION}_linux_arm64.zip" -o pocketbase.zip && \
    unzip pocketbase.zip && \
    rm pocketbase.zip && \
    cp pocketbase /pb/pocketbase

# Set working directory
WORKDIR /pb

# Copy hooks
COPY pb_hooks/ /pb/pb_hooks/
COPY pb_public/ /pb/pb_public/
COPY pb_migrations/ /pb/pb_migrations/

# Expose PocketBase default port
EXPOSE 8090

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8090/api/health || exit 1

# Run PocketBase
ENTRYPOINT ["./pocketbase"]
CMD ["serve", "--http=0.0.0.0:8090"]
