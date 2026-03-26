"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CreditCard,
  Calendar,
  Wallet,
  ArrowLeftRight,
  Upload,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";

export default function GuiaPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold">Guía de uso</h1>

      {/* Rutina */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Tu rutina
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex gap-3 items-start">
              <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded shrink-0">CADA SEMANA</span>
              <div>
                <p className="font-medium">Subir Excel de tarjeta Unicaja</p>
                <p className="text-sm text-muted-foreground">
                  Descarga el Excel desde la app de Unicaja → ve a <strong>Tarjeta → Importar Excel</strong> → sube el fichero.
                  Los duplicados se detectan solos, puedes subirlo tantas veces como quieras.
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded shrink-0">CADA SEMANA</span>
              <div>
                <p className="font-medium">Apuntar gastos en efectivo</p>
                <p className="text-sm text-muted-foreground">
                  El domingo, cuenta lo que te queda en el bolsillo. La diferencia con lo que tenías es lo que gastaste.
                  Ve a <strong>Transacciones → Nuevo</strong>: tipo <strong>Gasto</strong>, cuenta <strong>Efectivo</strong>,
                  categoría <strong>GASTOS DIARIOS</strong>, descripción &quot;Gastos semana X&quot;.
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded shrink-0">CUANDO PASE</span>
              <div>
                <p className="font-medium">Cobros en efectivo</p>
                <p className="text-sm text-muted-foreground">
                  Cuando Eve te pague o recibas efectivo: <strong>Transacciones → Nuevo</strong>:
                  tipo <strong>Ingreso</strong>, cuenta <strong>Efectivo</strong>. Márcalo como <strong>cobrado</strong>.
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded shrink-0">CUANDO PASE</span>
              <div>
                <p className="font-medium">Sacar dinero del cajero</p>
                <p className="text-sm text-muted-foreground">
                  Es una transferencia: <strong>Transacciones → Nuevo</strong>: tipo <strong>Transferencia</strong>,
                  cuenta <strong>Unicaja Cuenta</strong>, descripción &quot;Cajero 150€&quot;.
                  Luego otro ingreso en cuenta <strong>Efectivo</strong> por el mismo importe.
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded shrink-0">CUANDO PASE</span>
              <div>
                <p className="font-medium">Marcar pagos como pagados</p>
                <p className="text-sm text-muted-foreground">
                  Cuando veas que te han cobrado algo (hipoteca, préstamo, etc.),
                  ve a <strong>Transacciones</strong> y activa el toggle de <strong>Pagado</strong>.
                  Esto actualiza el saldo de la cuenta.
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-1 rounded shrink-0">DÍA 1 DEL MES</span>
              <div>
                <p className="font-medium">Generar fijos del mes</p>
                <p className="text-sm text-muted-foreground">
                  Ve a <strong>Fijos → Generar mes</strong>. Esto crea automáticamente todos los gastos/ingresos
                  fijos del mes (hipoteca, préstamos, sueldos, etc.) como pendientes de pago.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cuentas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Tus cuentas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full bg-[#1e40af]" />
              <strong>Unicaja Cuenta</strong> — Cuenta principal. Domiciliaciones, recibos, transferencias.
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full bg-[#3b82f6]" />
              <strong>Unicaja Tarjeta</strong> — Compras con tarjeta. Se cargan importando el Excel.
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full bg-[#0c4a6e]" />
              <strong>BBVA</strong> — Sueldo MyTransfer + préstamo. Compras aplazadas a mano.
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full bg-[#059669]" />
              <strong>Cajamar</strong> — Préstamo + revolving. Solo fijos mensuales.
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full bg-[#000000]" />
              <strong>N26</strong> — Para apartar IVA. Solo transferencias.
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full bg-[#16a34a]" />
              <strong>Efectivo</strong> — Lo que cobras/pagas en mano.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Casos especiales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5" />
            Casos especiales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-5 text-sm">
            <div>
              <p className="font-semibold mb-1">Regalo grupal / Gastos compartidos</p>
              <p className="text-muted-foreground mb-2">
                Ejemplo: compras un regalo de 170&euro; con la tarjeta. De esos, 20&euro; son tuyos y los amigos te devuelven 150&euro;.
              </p>
              <ol className="list-decimal ml-5 space-y-1">
                <li>Los 170&euro; aparecen al importar el Excel de tarjeta &rarr; gasto normal</li>
                <li>Los bizums que te devuelven &rarr; <strong>Ingreso</strong>, cuenta <strong>Unicaja Cuenta</strong>, categor&iacute;a <strong>REEMBOLSO</strong></li>
                <li>El efectivo que te den en mano &rarr; <strong>Ingreso</strong>, cuenta <strong>Efectivo</strong>, categor&iacute;a <strong>REEMBOLSO</strong></li>
              </ol>
              <p className="text-muted-foreground mt-1">
                As&iacute; cuadra con el banco y puedes ver tus ingresos reales filtrando sin REEMBOLSO.
              </p>
            </div>

            <div>
              <p className="font-semibold mb-1">Hosting / Dominios de amigos</p>
              <p className="text-muted-foreground mb-2">
                Pagas un hosting de un amigo y luego te hace bizum.
              </p>
              <ol className="list-decimal ml-5 space-y-1">
                <li>El pago del hosting &rarr; aparece como gasto (tarjeta o banco)</li>
                <li>El bizum de vuelta &rarr; <strong>Ingreso</strong>, categor&iacute;a <strong>REEMBOLSO</strong></li>
              </ol>
            </div>

            <div>
              <p className="font-semibold mb-1">150&euro; semanales para gastos diarios</p>
              <p className="text-muted-foreground mb-2">
                Apartas 150&euro; a la semana para compras y comida en efectivo.
              </p>
              <ol className="list-decimal ml-5 space-y-1">
                <li><strong>Si sacas del cajero:</strong> Transacci&oacute;n tipo <strong>Transferencia</strong>, cuenta <strong>Unicaja Cuenta</strong>, descripci&oacute;n &quot;Cajero 150&euro;&quot;. Luego otra transacci&oacute;n tipo <strong>Ingreso</strong>, cuenta <strong>Efectivo</strong>, 150&euro;, descripci&oacute;n &quot;Cajero&quot;</li>
                <li><strong>Si lo coges del efectivo que ya tienes:</strong> no hace falta nada, ya est&aacute; en la cuenta Efectivo</li>
                <li><strong>El domingo:</strong> cuenta lo que te queda. La diferencia es lo que gastaste. Mete un <strong>Gasto</strong>, cuenta <strong>Efectivo</strong>, categor&iacute;a <strong>GASTOS DIARIOS</strong>, descripci&oacute;n &quot;Gastos semana X&quot;</li>
              </ol>
            </div>

            <div>
              <p className="font-semibold mb-1">Mover dinero entre cuentas (apartar IVA, cubrir Cajamar...)</p>
              <ol className="list-decimal ml-5 space-y-1">
                <li>Transacci&oacute;n tipo <strong>Transferencia</strong> en la cuenta <strong>de donde sale</strong> el dinero</li>
                <li>Las transferencias NO afectan al balance de ingresos/gastos</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Qué NO hacer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Errores comunes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex gap-2 items-start">
              <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
              <p><strong>NO metas el REC.MCARD</strong> como gasto. Es el recibo de la tarjeta Unicaja y esos gastos ya están contados en los movimientos de tarjeta.</p>
            </div>
            <div className="flex gap-2 items-start">
              <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
              <p><strong>NO metas transferencias entre tus cuentas como ingreso/gasto.</strong> Usa el tipo &quot;Transferencia&quot;. Mover dinero de Unicaja a N26 no es un gasto.</p>
            </div>
            <div className="flex gap-2 items-start">
              <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
              <p><strong>NO dupliques gastos de tarjeta.</strong> Si compraste algo con la tarjeta Unicaja, NO lo metas también a mano. Ya viene en el Excel.</p>
            </div>
            <div className="flex gap-2 items-start">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              <p><strong>SÍ puedes subir el mismo Excel varias veces.</strong> Los duplicados se detectan automáticamente.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tipos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5" />
            Tipos de movimiento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><span className="inline-block bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded mr-2">Ingreso</span> Dinero que recibes: sueldos, bizums, pagos de clientes.</p>
            <p><span className="inline-block bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded mr-2">Gasto</span> Dinero que pagas: recibos, compras, servicios.</p>
            <p><span className="inline-block bg-gray-100 text-gray-700 text-xs font-bold px-2 py-0.5 rounded mr-2">Transferencia</span> Dinero que mueves entre tus propias cuentas. NO afecta al balance.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
