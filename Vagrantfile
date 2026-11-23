
Vagrant.configure("2") do |config|
  config.vm.box = "ubuntu/jammy64"
  config.vm.box_version = "20241002.0.0"
  config.vm.hostname = "todo-vm"

  # --- Réseau -------------------------------------------------------------
  # IP privée fixe : accessible depuis le Mac (http://192.168.56.10:5111)
  config.vm.network "private_network", ip: "192.168.56.10"

  # Ports redirigés sur 0.0.0.0 du Mac : accessibles depuis tout appareil
  # du même réseau via http://<IP-du-Mac>:<port>
  config.vm.network "forwarded_port", guest: 5111, host: 5111, host_ip: "0.0.0.0"  # Todo app
  config.vm.network "forwarded_port", guest: 9090, host: 9090, host_ip: "0.0.0.0"  # Prometheus
  config.vm.network "forwarded_port", guest: 3001, host: 3001, host_ip: "0.0.0.0"  # Grafana

  # (Optionnel) Réseau ponté : la VM obtient sa propre IP sur ton Wi-Fi.
  # config.vm.network "public_network", bridge: "en0: Wi-Fi"

  # --- Ressources VirtualBox ---------------------------------------------
  config.vm.provider "virtualbox" do |vb|
    vb.name   = "todo-vm"
    vb.memory = 3072   # app + Prometheus + Grafana
    vb.cpus   = 2
  end

  # --- Provisioning : installation de Docker + Docker Compose ------------
  config.vm.provision "shell", path: "provision.sh"
end
