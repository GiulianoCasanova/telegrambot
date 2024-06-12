
CREATE DATABASE IF NOT EXISTS finance_bot;

USE finance_bot;
create table if not exists MasterGrupoUser (
    idgrupo_usuario int AUTO_INCREMENT PRIMARY KEY,
    idusuario_part bigint(20),
    nombre_usuario varchar(60)
);

create table if not exists MasterGrupoGastos(
    idgrupo_gasto int AUTO_INCREMENT PRIMARY KEY,
    idgrupo_usuario int,
    iduser bigint(20),
    nombre_grupo VARCHAR(50),
    fecha_inicio date,
    gasto_cerrado boolean,
    idchat bigint(20),
    constraint fk_GrupoGastos foreign KEY(idgrupo_usuario) references MasterGrupoUser(idgrupo_usuario)
);


create table if not exists gastos(
    idchat bigint(20) NOT NULL,
    iduser bigint(20) NOT NULL,
    idgasto INT AUTO_INCREMENT PRIMARY KEY,
    idgrupo_gasto INT,
    monto float NOT NULL,
    fechaGasto date,
    gasto_saldado boolean,
    constraint fk_gastos foreign KEY(idgrupo_gasto) references MasterGrupoGastos(idgrupo_gasto)
);


