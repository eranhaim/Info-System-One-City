from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    openai_api_key: str
    aws_access_key_id: str
    aws_secret_access_key: str
    aws_region: str = "eu-west-1"
    s3_bucket_name: str = "one-city-knowledge"
    llm_model_name: str = "gpt-4o-mini"
    embedding_model_name: str = "text-embedding-3-small"
    gentrix_api_key: str = ""
    mongodb_uri: str = ""
    admin_password: str = "onecity123"

    llm_temperature: float = 0.3

    chunk_size: int = 1000
    chunk_overlap: int = 200
    retriever_k: int = 5
    memory_window: int = 10

    model_config = {"env_file": ".env"}


settings = Settings()  # type: ignore[call-arg]
