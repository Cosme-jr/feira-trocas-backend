-- AddForeignKey
ALTER TABLE "Proposta" ADD CONSTRAINT "fk_proposta_dono_item_desejado" FOREIGN KEY ("itemDesejadoId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
