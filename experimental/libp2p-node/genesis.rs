use serde::{Deserialize, Serialize};
use std::fs;
use anyhow::{Result, Context};

#[derive(Debug, Serialize, Deserialize)]
pub struct Genesis {
    pub network_name: String,
    pub genesis_time: u64,
    pub initial_quest: Option<String>,
}

impl Genesis {
    pub fn load(path: &str) -> Result<Self> {
        let s = fs::read_to_string(path).context("reading genesis file")?;
        let g: Genesis = serde_json::from_str(&s).context("parsing genesis json")?;
        Ok(g)
    }

    pub fn log_summary(&self) {
        log::info!("Genesis loaded: network={} genesis_time={} initial_quest={:?}",
            self.network_name, self.genesis_time, self.initial_quest);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn roundtrip() {
        let g = Genesis { network_name: "cv-test".into(), genesis_time: 1, initial_quest: Some("hello".into()) };
        let s = serde_json::to_string(&g).unwrap();
        let p: Genesis = serde_json::from_str(&s).unwrap();
        assert_eq!(p.network_name, "cv-test");
    }
}
