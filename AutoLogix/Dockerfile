# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution and project files first for better caching
COPY *.sln ./
COPY AutoLogix.Api/*.csproj AutoLogix.Api/
COPY AutoLogix.Application/*.csproj AutoLogix.Application/
COPY AutoLogix.Domain/*.csproj AutoLogix.Domain/
COPY AutoLogix.Infrastructure/*.csproj AutoLogix.Infrastructure/

# Restore
RUN dotnet restore

# Copy the rest of the source
COPY . .

# Publish API
RUN dotnet publish AutoLogix.Api/AutoLogix.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Render exposes port via PORT env var, we will listen on 8080 by default
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "AutoLogix.Api.dll"]
