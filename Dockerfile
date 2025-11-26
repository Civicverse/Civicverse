FROM rust:1.72-slim AS builder
WORKDIR /usr/src/civic-node
COPY . .
RUN rustup default stable
RUN cargo build --release

FROM debian:bookworm-slim
COPY --from=builder /usr/src/civic-node/target/release/civic-node /usr/local/bin/civic-node
COPY genesis.json /usr/local/bin/genesis.json
ENTRYPOINT ["/usr/local/bin/civic-node", "--genesis", "/usr/local/bin/genesis.json"]
